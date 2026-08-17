gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============================================
   LENIS-STYLE SMOOTH SCROLL (lightweight, no dep)
   ============================================ */
let smoothScroll = { current: 0, target: 0, ease: 0.09 };
let rafId = null;

function initSmoothScroll(){
  if (reduceMotion) return;
  const body = document.body;
  document.documentElement.style.height = 'auto';

  // Simple approach: rely on native scroll but smooth via CSS scroll-behavior off,
  // and let GSAP ScrollTrigger read native scroll for reliability across mobile.
  // (Full virtual-scroll hijacking skipped for robustness/perf on all devices.)
}

/* ============================================
   LOADER — liquid wave fill
   ============================================ */
function runLoader(onComplete){
  const loader = document.getElementById('loader');
  const logo = document.getElementById('loaderLogo');
  const track = document.querySelector('.loader-bar-track');
  const wavePath = document.getElementById('loaderWavePath');
  const waveSvg = document.getElementById('loaderWave');

  if (reduceMotion){
    gsap.set(loader, { display:'none' });
    onComplete();
    return;
  }

  const W = 300, H = 16, BASE_Y = 8; // baseline top of liquid at rest (full = 0..16 fill)
  let progress = 0; // 0 -> 1
  let waveOffset = 0;
  let waveAmp = 1.6;
  let running = true;

  function buildPath(p, amp, offset){
    // liquid fills left-to-right; front edge has a wobble
    const fillX = p * W;
    const segments = 8;
    let top = `M0,${H}`;
    top += ` L0,${BASE_Y}`;
    // small organic wobble along the fill edge (vertical wave at the front)
    for (let i=0;i<=segments;i++){
      const t = i/segments;
      const y = BASE_Y + Math.sin((t*Math.PI*2) + offset) * amp * (1-p*0.3);
      // we draw the wave along x near fillX, but simplest: rectangular fill with wobble on right edge
    }
    // Simple robust shape: rectangle to fillX, with a wavy right edge
    const edgeSegs = 6;
    let d = `M0,${H} L0,${BASE_Y}`;
    for (let i=0;i<=edgeSegs;i++){
      const t = i/edgeSegs;
      const x = fillX;
      const y = BASE_Y - amp + t*(amp*2);
      const wob = Math.sin(offset + t*Math.PI*3) * amp;
      d += ` L${Math.max(0,x+wob*0.4)},${y}`;
    }
    d += ` L${fillX},${H} Z`;
    return d;
  }

  gsap.set(logo, { opacity:0, y: 16, scale: 0.92, clipPath: 'inset(0 100% 0 0)' });
  gsap.set(track, { opacity:0 });

  const introTl = gsap.timeline();
  introTl.to(logo, { clipPath: 'inset(0 0% 0 0)', duration:.9, ease:'power3.inOut' })
         .to(logo, { opacity:1, y:0, scale:1, duration:.9, ease:'power3.out' }, 0)
         .to(track, { opacity:1, duration:.5, ease:'power2.out' }, '-=.4');

  const state = { p: 0 };
  const fillTween = gsap.to(state, {
    p: 1,
    duration: 2.3,
    delay: 0.15,
    ease: 'power2.inOut',
    onUpdate(){
      progress = state.p;
    }
  });

  function tick(){
    if (!running) return;
    waveOffset += 0.09;
    const settling = progress > 0.985 ? gsap.utils.mapRange(0.985,1,1,0,progress) : 1;
    const amp = progress >= 1 ? 0 : waveAmp * (0.6 + 0.4*Math.sin(waveOffset*0.5));
    wavePath.setAttribute('d', buildPath(progress, amp, waveOffset));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  fillTween.eventCallback('onComplete', () => {
    running = false;
    wavePath.setAttribute('d', buildPath(1, 0, 0));
    const exitTl = gsap.timeline({
      onComplete(){
        gsap.set(loader, { display:'none' });
        onComplete();
      }
    });
    exitTl.to([logo, track], { opacity:0, duration:.4, ease:'power1.out' }, 0)
          .to(loader, {
            clipPath: 'inset(0 0 100% 0)',
            duration: .75,
            ease: 'power3.inOut'
          }, '.05');
  });
}

/* ============================================
   NAV — color switch on section background
   ============================================ */
function initNav(){
  const nav = document.getElementById('siteNav');
  const burger = document.getElementById('navBurger');
  const mobile = document.getElementById('navMobile');

  burger.addEventListener('click', () => {
    const open = mobile.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
    burger.classList.toggle('is-open', open);
  });
  mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    mobile.classList.remove('open');
    burger.setAttribute('aria-expanded', false);
  }));

  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate(){
      nav.classList.toggle('scrolled', window.scrollY > 40);
    }
  });

  const lightSections = document.querySelectorAll('.hero');
  lightSections.forEach(sec => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 90px',
      end: 'bottom 90px',
      onEnter: () => nav.classList.add('on-light'),
      onEnterBack: () => nav.classList.add('on-light'),
      onLeave: () => nav.classList.remove('on-light'),
      onLeaveBack: () => nav.classList.remove('on-light'),
    });
  });
}

/* ============================================
   HERO — statement reveal
   ============================================ */
function initHero(){
  gsap.set('.hero-title, .hero-sub, .hero-ctas', { opacity: 0, y: 24 });
  const tl = gsap.timeline({ delay: reduceMotion ? 0 : 0.15 });
  tl.to('.hero-title', { opacity: 1, y: 0, duration: .9, ease: 'power3.out' })
    .to('.hero-sub', { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, '-=.55')
    .to('.hero-ctas', { opacity: 1, y: 0, duration: .8, ease: 'power2.out' }, '-=.55');
}

/* ============================================
   INSIGHT — word reveal + line draw
   ============================================ */
function initInsight(){
  gsap.to('.insight-title .reveal-word', {
    opacity: 1,
    stagger: 0.02,
    duration: .4,
    ease: 'power1.out',
    scrollTrigger: {
      trigger: '.insight-title',
      start: 'top 80%',
      end: 'top 20%',
      scrub: 0.6
    }
  });

  gsap.fromTo('.insight-line', { scaleX: 0 }, {
    scaleX: 1, transformOrigin: 'left', duration: 1,
    scrollTrigger: { trigger: '.insight-foot', start: 'top 85%' }
  });
  gsap.set('.insight-line', { height: '1px', background: 'var(--indigo)', opacity: .0 });
  gsap.to('.insight-line', { opacity: .0 }); // keep invisible; underline effect not needed visually, foot border already present
}

/* ============================================
   QUÉ ANALIZAMOS — rows tension -> align + active bar
   ============================================ */
function initAnalizamos(){
  const rows = gsap.utils.toArray('.analiza-row');
  rows.forEach((row, i) => {
    const offset = (i % 2 === 0) ? -60 : 60;
    gsap.fromTo(row, {
      x: reduceMotion ? 0 : offset,
      opacity: 0
    }, {
      x: 0, opacity: 1, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: row, start: 'top 88%' }
    });

    ScrollTrigger.create({
      trigger: row,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => row.classList.add('is-active'),
      onEnterBack: () => row.classList.add('is-active'),
      onLeave: () => row.classList.remove('is-active'),
      onLeaveBack: () => row.classList.remove('is-active'),
    });
  });
}

/* ============================================
   BAKERY — image parallax
   ============================================ */
function initBakery(){
  if (reduceMotion) return;
  gsap.to('.bakery-img', {
    scale: 1,
    y: -30,
    ease: 'none',
    scrollTrigger: {
      trigger: '.bakery',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.8
    }
  });
  gsap.fromTo('.bakery-content > *', { y: 26, opacity: 0 }, {
    y: 0, opacity: 1, duration: .8, ease: 'power2.out', stagger: 0.08,
    scrollTrigger: { trigger: '.bakery-content', start: 'top 70%' }
  });
}

/* ============================================
   FOOTER — reveal
   ============================================ */
function initFooter(){
  gsap.fromTo('.footer-slogan, .footer-logo', { y: 24, opacity: 0 }, {
    y: 0, opacity: 1, duration: .9, stagger: 0.1, ease: 'power2.out',
    scrollTrigger: { trigger: '.footer-top', start: 'top 82%' }
  });
  gsap.fromTo('.footer-cta, .footer-contact-details', { y: 20, opacity: 0 }, {
    y: 0, opacity: 1, duration: .8, stagger: 0.1, ease: 'power2.out',
    scrollTrigger: { trigger: '.footer-main', start: 'top 78%' }
  });
}

/* ============================================
   SECTION TITLE / GENERIC FADE-UPS
   ============================================ */
function initGenericFadeUps(){
  gsap.utils.toArray('.analizamos-head, .especializacion-head').forEach(el => {
    gsap.fromTo(el, { y: 28, opacity: 0 }, {
      y: 0, opacity: 1, duration: .9, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });
}

/* ============================================
   ESPECIALIZACIÓN — infinite fast marquee carousel
   ============================================ */
function initEspecialCarousel(){
  const track = document.getElementById('especialTrack');
  if (!track) return;

  if (reduceMotion){
    return; // static, no animation
  }

  // wait a tick for images to lay out and get real width
  requestAnimationFrame(() => {
    const totalWidth = track.scrollWidth;
    const loopWidth = totalWidth / 2; // track has original 5 + 3 duplicated slides; use half as approx loop unit
    // more robust: measure width of first 5 slides (original set) via data
    const slides = track.querySelectorAll('.especial-slide');
    const originalCount = 5;
    let loopDistance = 0;
    for (let i = 0; i < originalCount; i++){
      loopDistance += slides[i].getBoundingClientRect().width + 20; // gap
    }

    gsap.set(track, { x: 0 });
    const tween = gsap.to(track, {
      x: -loopDistance,
      duration: 14,
      ease: 'none',
      repeat: -1,
      modifiers: {
        x: gsap.utils.unitize(x => {
          const val = parseFloat(x) % loopDistance;
          return val > 0 ? val - loopDistance : val;
        })
      }
    });

    const carousel = document.getElementById('especialCarousel');
    carousel.addEventListener('mouseenter', () => tween.timeScale(0.35));
    carousel.addEventListener('mouseleave', () => tween.timeScale(1));
  });
}

/* ============================================
   INIT
   ============================================ */
function initAll(){
  initNav();
  initHero();
  initInsight();
  initAnalizamos();
  initEspecialCarousel();
  initBakery();
  initFooter();
  initGenericFadeUps();
  ScrollTrigger.refresh();
}

document.addEventListener('DOMContentLoaded', () => {
  const hasVisited = sessionStorage.getItem('nodus_loaded');

  if (hasVisited){
    document.getElementById('loader').style.display = 'none';
    initAll();
  } else {
    // wait for full load (images/fonts) but cap wait time
    let doneCalled = false;
    const done = () => {
      if (doneCalled) return; // guard: 'load' event + safety timeout could both fire
      doneCalled = true;
      window.removeEventListener('load', done);
      runLoader(() => {
        sessionStorage.setItem('nodus_loaded', '1');
        initAll();
      });
    };
    if (document.readyState === 'complete'){
      done();
    } else {
      window.addEventListener('load', done);
      // safety timeout in case load event is delayed
      setTimeout(done, 3500);
    }
  }
});
