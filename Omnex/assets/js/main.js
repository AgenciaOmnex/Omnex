/* ─── TRACKING — GA4 / GTM listo para producción ───────────────────────────
   La web no está publicada aún. No hay scripts externos activos.
   Cuando esté lista, sigue el checklist de producción al final de este bloque.

   Eventos configurados:
   click_cta_nav | click_cta_hero | click_cta_problemas | click_cta_servicios
   click_cta_sectores | form_start | form_submit | form_error
   ─────────────────────────────────────────────────────────────────────────── */
function trackEvent(eventName, eventData = {}) {
  console.log('[Tracking]', eventName, eventData);

  // FUTURO GA4 — añade el snippet de gtag.js en <head> con tu ID (G-XXXXXXXXXX):
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', eventName, eventData);
  // }

  // FUTURO GTM — añade el snippet de GTM en <head> y <body>:
  // window.dataLayer = window.dataLayer || [];
  // window.dataLayer.push({ event: eventName, ...eventData });
}

/* Dispara trackEvent en todos los elementos con data-event al hacer click */
document.querySelectorAll('[data-event]').forEach(el => {
  el.addEventListener('click', () => {
    trackEvent(el.dataset.event, { label: el.textContent.trim().slice(0, 80) });
  });
});

/* ─── PAGE LOADER ─────────────────────────────────────────────────────────── */
(function () {
  const loader = document.getElementById('pageLoader');
  if (!loader) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.innerWidth <= 768;

  function hideLoader() {
    loader.classList.add('loaded');
    /* CSS transition: 0.45s (0 si prefers-reduced-motion → ya gestionado en CSS) */
    setTimeout(() => {
      loader.style.display = 'none';
      revealHeroCard();
    }, prefersReduced ? 0 : 500);
  }

  /* Con reduced-motion: ocultar inmediatamente sin animación */
  if (prefersReduced) {
    hideLoader();
    return;
  }

  /* Mobile y Desktop: 2000ms de espera + 500ms fade = 2,5 s total */
  const delay = 2000;

  if (document.readyState === 'complete') {
    setTimeout(hideLoader, delay);
  } else {
    window.addEventListener('load', () => setTimeout(hideLoader, delay));
  }
})();

/* ─── HERO CARD — aparece tras el loader ─────────────────────────────────── */
function revealHeroCard() {
  const card = document.querySelector('.hero__card-wrap');
  if (!card) return;
  card.classList.add('card-visible');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  card.querySelectorAll('.hero__metric-val[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target, 10);
    if (prefersReduced) { el.textContent = target; return; }
    const start = performance.now();
    const duration = 1400;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(ease * target);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
}

/* ─── NAVBAR SCROLL EFFECT ───────────────────────────────────────────────── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ─── MOBILE MENU TOGGLE ─────────────────────────────────────────────────── */
document.getElementById('navToggle').addEventListener('click', () => {
  navbar.classList.toggle('open');
});
document.querySelectorAll('.nav__links a, .nav__cta a').forEach(link => {
  link.addEventListener('click', () => navbar.classList.remove('open'));
});

/* ─── FADE-IN ON SCROLL ──────────────────────────────────────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

/* En móvil, los pasos de "Cómo funciona" usan observer propio con rootMargin
   más restrictivo para que cada paso aparezca individualmente al hacer scroll */
const isMob = window.innerWidth <= 768;
const howStepSet = isMob
  ? new Set(document.querySelectorAll('.captacion-flow__step.fade-in'))
  : new Set();

document.querySelectorAll('.fade-in').forEach(el => {
  if (!howStepSet.has(el)) observer.observe(el);
});

if (howStepSet.size) {
  const stepObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        stepObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -130px 0px' });
  howStepSet.forEach(el => stepObserver.observe(el));
}

/* ─── FAQ ACCORDION ──────────────────────────────────────────────────────── */
document.querySelectorAll('.faq__q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq__item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

/* ─── CONTACT FORM — borde gira con el ratón ─────────────────────────────── */
const contactFormEl = document.querySelector('.contact__form');
if (contactFormEl) {
  contactFormEl.addEventListener('mousemove', (e) => {
    contactFormEl.style.animationPlayState = 'paused';
    const rect = contactFormEl.getBoundingClientRect();
    const angle = Math.atan2(e.clientY - rect.top - rect.height / 2, e.clientX - rect.left - rect.width / 2) * (180 / Math.PI) + 90;
    contactFormEl.style.setProperty('--grad-angle', `${angle}deg`);
  });
  contactFormEl.addEventListener('mouseleave', () => {
    contactFormEl.style.removeProperty('--grad-angle');
    contactFormEl.style.animationPlayState = 'running';
  });
}

/* ─── WARP CANVAS — inyectar en cards (WebGL, solo desktop) ─────────────── */
document.querySelectorAll('.problem-card, .trust-card, .industry-card').forEach(el => {
  const bg = document.createElement('canvas');
  bg.className = 'plan__canvas';
  bg.setAttribute('aria-hidden', 'true');
  el.insertBefore(bg, el.firstChild);
});

/* ─── CONTACT FORM → Google Sheets ──────────────────────────────────────── */
const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbz3pay2VFhAHiT3f9ssEKBufUar7CS_aZEGB-zfOygtMeqcJ2gDqfV4aOW-5cFsRRue/exec';

const FIELD_MAX = { nombre: 100, negocio: 100, telefono: 20, email: 100, mensaje: 2000 };

const form        = document.getElementById('contactForm');
const submitBtn   = form.querySelector('.form__submit');
const formSuccess = document.getElementById('formSuccess');
const formError   = document.getElementById('formError');

function showFormError(msg) {
  if (!formError) return;
  formError.textContent = msg;
  formError.style.display = 'block';
  setTimeout(() => { formError.style.display = 'none'; }, 6000);
}

/* form_start + timestamp de primera interacción (para control de velocidad) */
let formStarted    = false;
let formFirstTouch = null;

form.querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('focus', () => {
    if (!formFirstTouch) formFirstTouch = Date.now();
    if (formStarted) return;
    formStarted = true;
    trackEvent('form_start');
  });
});

function validateForm() {
  const nombre   = form.nombre.value.trim();
  const negocio  = form.negocio.value.trim();
  const telefono = form.telefono.value.trim();
  const email    = form.email.value.trim();
  const mensaje  = form.mensaje.value.trim();

  if (!nombre)                                        return 'El nombre es obligatorio.';
  if (nombre.length   > FIELD_MAX.nombre)             return 'El nombre no puede superar los 100 caracteres.';
  if (!negocio)                                       return 'El nombre del negocio es obligatorio.';
  if (negocio.length  > FIELD_MAX.negocio)            return 'El nombre del negocio no puede superar los 100 caracteres.';
  if (!telefono)                                      return 'El teléfono es obligatorio.';
  if (telefono.length > FIELD_MAX.telefono)           return 'El teléfono no puede superar los 20 caracteres.';
  if (!/^[0-9 ()+\-]{6,20}$/.test(telefono))         return 'El teléfono solo puede contener números, espacios, +, - y paréntesis.';
  if (!email)                                         return 'El email es obligatorio.';
  if (email.length    > FIELD_MAX.email)              return 'El email no puede superar los 100 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return 'El formato del email no es válido.';
  if (!form.consentimiento_gestion.checked)           return 'Debes aceptar la Política de Privacidad para continuar.';
  if (mensaje.length  > FIELD_MAX.mensaje)            return 'El mensaje no puede superar los 2000 caracteres.';
  return null;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Enviando…';
  formSuccess.style.display = 'none';
  if (formError) formError.style.display = 'none';

  /* Honeypot: si el campo oculto tiene contenido, simular éxito sin enviar */
  const honeypot = form.querySelector('[name="empresa_web_url"]');
  if (honeypot && honeypot.value.trim() !== '') {
    form.reset();
    formSuccess.style.display = 'block';
    setTimeout(() => { formSuccess.style.display = 'none'; }, 6000);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    return;
  }

  /* Control de tiempo: envío en menos de 3 s desde la primera interacción = probable bot */
  if (formFirstTouch && (Date.now() - formFirstTouch) < 3000) {
    form.reset();
    formSuccess.style.display = 'block';
    setTimeout(() => { formSuccess.style.display = 'none'; }, 6000);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    return;
  }

  /* Validación de campos */
  const validationError = validateForm();
  if (validationError) {
    showFormError('⚠️ ' + validationError);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
    return;
  }

  const nombre    = form.nombre.value.trim();
  const negocio   = form.negocio.value.trim();
  const telefono  = form.telefono.value.trim();
  const email     = form.email.value.trim();
  const necesidad = form.necesidad.value;
  const mensaje   = form.mensaje.value.trim().slice(0, FIELD_MAX.mensaje);

  const payload = {
    fecha:                    new Date().toLocaleString('es-ES'),
    nombre,
    negocio,
    telefono,
    email,
    consentimiento_comercial: form.consentimiento_comercial.checked ? 'Sí' : 'No'
  };
  if (necesidad) payload.necesidad = necesidad;
  if (mensaje)   payload.mensaje   = mensaje;

  try {
    // IMPORTANTE: con no-cors no se puede confirmar realmente si Google Sheets recibió el formulario.
    // Revisar integración antes de enviar tráfico real.
    await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });

    form.reset();
    formSuccess.style.display = 'block';
    setTimeout(() => { formSuccess.style.display = 'none'; }, 6000);

    trackEvent('form_submit', {
      form_id:   'contact_form',
      form_name: 'Formulario contacto Omnex'
    });

  } catch (err) {
    console.error('[Form] Error al enviar:', err);
    showFormError('❌ No se ha podido enviar el formulario. Inténtalo de nuevo o escríbenos directamente por WhatsApp.');
    trackEvent('form_error', { form_id: 'contact_form' });

  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
});

/* ── Cards WebGL shader — vertex displacement + noise glow (desktop) ── */
(function () {
  const allCanvases = document.querySelectorAll('.plan__canvas');
  if (!allCanvases.length) return;

  /* En móvil los gradientes CSS gestionan el fondo de las cards.
     WebGL requiere GPU readback por cada drawImage (~30 calls/frame)
     lo que degrada el scroll y la respuesta táctil en móvil. */
  if (window.innerWidth <= 768) return;

  const PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SIZE = 256;
  const shared = document.createElement('canvas');
  shared.width = SIZE; shared.height = SIZE;
  shared.setAttribute('aria-hidden', 'true');
  Object.assign(shared.style, {
    position: 'fixed', top: '-9999px', left: '-9999px',
    width: SIZE + 'px', height: SIZE + 'px',
    pointerEvents: 'none', opacity: '0'
  });
  document.body.appendChild(shared);

  const gl = shared.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true })
          || shared.getContext('experimental-webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!gl) return;

  const vs = `
    attribute vec2 a_pos;
    uniform float time;
    uniform float intensity;
    uniform vec2  seed;
    varying vec2  vUv;
    void main() {
      vUv = a_pos * 0.5 + 0.5;
      vec2 pos = a_pos;
      pos.y += sin(pos.x * 10.0 + time + seed.x) * 0.1 * intensity;
      pos.x += cos(pos.y *  8.0 + time * 1.5 + seed.y) * 0.05 * intensity;
      gl_Position = vec4(pos, 0.0, 1.0);
    }
  `;

  const fs = `
    precision mediump float;
    uniform float time;
    uniform float intensity;
    uniform vec2  seed;
    varying vec2  vUv;
    void main() {
      vec2 uv = vUv;
      float t = time + seed.x * 0.3;

      float noise  = sin(uv.x * 20.0 + t)       * cos(uv.y * 15.0 + t * 0.8);
            noise += sin(uv.x * 35.0 - t * 2.0)  * cos(uv.y * 25.0 + t * 1.2) * 0.5;

      vec3 c1 = vec3(0.486, 0.227, 0.929);
      vec3 c2 = vec3(0.753, 0.149, 0.827);
      vec3 color = mix(c1, c2, noise * 0.5 + 0.5);
      color = mix(color, vec3(0.88, 0.50, 0.99), pow(abs(noise), 2.0) * intensity * 0.5);

      float glow = clamp(1.0 - length(uv - 0.5) * 2.0, 0.0, 1.0);
      glow = pow(glow, 1.5);

      vec3 bg = vec3(0.035, 0.016, 0.070);
      gl_FragColor = vec4(mix(bg, color, glow * 0.9 + 0.1), 1.0);
    }
  `;

  function mkShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }

  const prog = gl.createProgram();
  const vs_ = mkShader(gl.VERTEX_SHADER, vs);
  const fs_ = mkShader(gl.FRAGMENT_SHADER, fs);
  if (!vs_ || !fs_) return;
  gl.attachShader(prog, vs_); gl.attachShader(prog, fs_);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const GRID = 16;
  const verts = [], indices = [];
  for (let y = 0; y <= GRID; y++)
    for (let x = 0; x <= GRID; x++)
      verts.push((x / GRID) * 2 - 1, (y / GRID) * 2 - 1);
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      const tl = y * (GRID + 1) + x;
      indices.push(tl, tl+1, tl+GRID+1, tl+1, tl+GRID+2, tl+GRID+1);
    }

  const vbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);

  const ibuf = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibuf);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime      = gl.getUniformLocation(prog, 'time');
  const uIntensity = gl.getUniformLocation(prog, 'intensity');
  const uSeed      = gl.getUniformLocation(prog, 'seed');

  gl.viewport(0, 0, SIZE, SIZE);

  const seeds = Array.from(allCanvases).map((_, i) => [(i * 2.3) % 7.0, (i * 3.7) % 5.0]);
  const ctxs  = Array.from(allCanvases).map(c => c.getContext('2d'));

  function syncSize(c) {
    const r = c.parentElement ? c.parentElement.getBoundingClientRect() : { width: 300, height: 200 };
    c.width  = Math.round(r.width)  || 300;
    c.height = Math.round(r.height) || 200;
  }
  allCanvases.forEach(syncSize);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => allCanvases.forEach(syncSize), 200);
  });

  const IDX_COUNT = indices.length;

  function renderAll(t) {
    const intensity = 1.0 + Math.sin(t * 2.0) * 0.3;
    gl.uniform1f(uIntensity, intensity);
    ctxs.forEach((ctx, i) => {
      if (!ctx) return;
      gl.uniform1f(uTime, t + seeds[i][0] * 0.1);
      gl.uniform2f(uSeed, seeds[i][0], seeds[i][1]);
      gl.drawElements(gl.TRIANGLES, IDX_COUNT, gl.UNSIGNED_SHORT, 0);
      ctx.drawImage(shared, 0, 0, ctx.canvas.width, ctx.canvas.height);
    });
  }

  if (PRM) { renderAll(0); return; }

  const TARGET = 1000 / 30;
  let start = performance.now(), last = 0, raf = null;
  let tabVis = !document.hidden, sectVis = false;

  function tryStart() { if (tabVis && sectVis && !raf) raf = requestAnimationFrame(frame); }
  function tryStop()  { if (raf) { cancelAnimationFrame(raf); raf = null; } }
  function syncGL()   { tabVis && sectVis ? tryStart() : tryStop(); }

  function frame(now) {
    if (now - last >= TARGET) { last = now; renderAll((now - start) * 0.001); }
    raf = requestAnimationFrame(frame);
  }

  document.addEventListener('visibilitychange', () => { tabVis = !document.hidden; syncGL(); });

  const sectObs = new IntersectionObserver(entries => {
    sectVis = entries.some(e => e.isIntersecting);
    syncGL();
  }, { rootMargin: '200px' });
  [...new Set([...allCanvases].map(c => c.closest('section') || c.parentElement))]
    .forEach(s => sectObs.observe(s));
})();

/* ─── Barra de progreso de scroll ────────────────────────────────────────── */
(function () {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  const docEl = document.documentElement;
  window.addEventListener('scroll', () => {
    const total = docEl.scrollHeight - docEl.clientHeight;
    bar.style.width = (total > 0 ? Math.min(docEl.scrollTop / total * 100, 100) : 0) + '%';
  }, { passive: true });
})();

/* ─── Nav: enlace activo según sección más centrada en pantalla ──────────── */
(function () {
  const pairs = ['problemas', 'servicios', 'faq'].map(id => ({
    section: document.getElementById(id),
    link: document.querySelector(`.nav__links a[href="#${id}"]`)
  })).filter(p => p.section && p.link);

  if (!pairs.length) return;

  function update() {
    const mid = window.innerHeight * 0.4;
    let best = null, bestDist = Infinity;
    pairs.forEach(p => {
      const r = p.section.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) {
        const dist = Math.abs(r.top + r.height / 2 - mid);
        if (dist < bestDist) { bestDist = dist; best = p; }
      }
    });
    pairs.forEach(p => p.link.classList.toggle('active', p === best));
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
})();

/* ─── Hero card: tilt 3D sutil en hover (solo desktop, post-reveal) ─────── */
(function () {
  const wrap = document.querySelector('.hero__card-wrap');
  if (!wrap || 'ontouchstart' in window) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const MAX = 5;

  function onMove(e) {
    const r = wrap.getBoundingClientRect();
    const x =  ((e.clientX - r.left) / r.width  - 0.5) * MAX;
    const y = -((e.clientY - r.top)  / r.height - 0.5) * MAX;
    wrap.style.transform  = `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`;
    wrap.style.transition = 'transform .1s ease';
  }

  function onLeave() {
    wrap.style.transform  = '';
    wrap.style.transition = 'transform .7s cubic-bezier(.22,1,.36,1)';
    setTimeout(() => { wrap.style.transition = ''; }, 780);
  }

  /* Esperar a que complete la animación de entrada de la card (~2s post-reveal) */
  setTimeout(() => {
    wrap.addEventListener('mousemove', onMove, { passive: true });
    wrap.addEventListener('mouseleave', onLeave);
  }, 2200);
})();

/* ─── Stats ticker: animación JS con desaceleración suave en hover ───────── */
(function () {
  const wrap  = document.querySelector('.stats-ticker');
  const track = document.querySelector('.stats-ticker__track');
  if (!wrap || !track) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let pos         = 0;
  let speed       = 1;
  let targetSpeed = 1;
  let halfWidth   = 0;

  let rafId = null;

  function tick() {
    if (!halfWidth) halfWidth = track.scrollWidth / 2;
    speed += (targetSpeed - speed) * 0.055;
    pos -= speed;
    if (Math.abs(pos) >= halfWidth) pos += halfWidth;
    track.style.transform = `translateX(${pos}px)`;
    rafId = requestAnimationFrame(tick);
  }

  function start() { if (!rafId) rafId = requestAnimationFrame(tick); }
  function stop()  { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  wrap.addEventListener('mouseenter', () => { targetSpeed = 0; });
  wrap.addEventListener('mouseleave', () => { targetSpeed = 1; });

  new IntersectionObserver(([e]) => { e.isIntersecting ? start() : stop(); },
    { rootMargin: '100px' }).observe(wrap);

  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

  start();
})();

/* ─── Nosotros accordion (móvil) ─────────────────────────────────────────── */
(function () {
  if (!window.matchMedia('(max-width: 768px)').matches) return;

  const triggers = document.querySelectorAll('#nosotros .nosotros-card__trigger');
  if (!triggers.length) return;

  triggers.forEach(trigger => {
    const activate = () => {
      const card = trigger.closest('.nosotros-card');
      const isOpen = card.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', isOpen);
    };

    trigger.addEventListener('click', activate);
    trigger.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); }
    });
  });
})();

/* ─── Services carousel (móvil) ─────────────────────────────────────────── */
(function () {
  const grid = document.querySelector('#servicios .services-grid');
  if (!grid) return;

  const mq = window.matchMedia('(max-width: 768px)');

  // Cards originales en orden DOM
  const cards = [...grid.querySelectorAll('.trust-card')];
  const count  = cards.length;

  let track          = null;
  let dotsWrap       = null;
  let timer          = null;
  let current        = 0;
  let resizeHandler  = null;
  let carouselObs    = null;
  let carouselInView = false;

  function cardWidth() { return grid.offsetWidth; }

  function sizeCards() {
    const w = grid.offsetWidth;
    cards.forEach(c => { c.style.width = w + 'px'; c.style.minWidth = w + 'px'; });
  }

  function moveTo(x, animate) {
    track.style.transition = animate
      ? 'transform 0.38s cubic-bezier(0.25, 0.1, 0.25, 1)'
      : 'none';
    track.style.transform = `translateX(${x}px)`;
  }

  function updateDots() {
    dotsWrap.querySelectorAll('.services-dots__dot').forEach((d, i) => {
      d.classList.toggle('is-active', i === current);
    });
  }

  function goTo(index, animate = true) {
    current = (index + count) % count;
    moveTo(-current * cardWidth(), animate);
    updateDots();
    resetTimer();
  }

  function resetTimer() {
    clearInterval(timer);
    if (carouselInView && !document.hidden)
      timer = setInterval(() => goTo(current + 1), 5000);
  }

  function initCarousel() {
    if (track) return; // ya montado

    track = document.createElement('div');
    track.className = 'services-track';
    cards.forEach(c => track.appendChild(c));
    grid.appendChild(track);

    sizeCards();
    resizeHandler = () => { sizeCards(); goTo(current, false); };
    window.addEventListener('resize', resizeHandler);

    dotsWrap = document.createElement('div');
    dotsWrap.className = 'services-dots';
    dotsWrap.setAttribute('role', 'tablist');
    dotsWrap.setAttribute('aria-label', 'Navegación de servicios');
    cards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'services-dots__dot';
      dot.setAttribute('aria-label', `Servicio ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    grid.after(dotsWrap);

    let startX = 0;
    let dragDelta = 0;
    track.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      dragDelta = 0;
      clearInterval(timer);
      track.classList.add('is-dragging');
    }, { passive: true });
    track.addEventListener('touchmove', e => {
      dragDelta = e.touches[0].clientX - startX;
      moveTo(-current * cardWidth() + dragDelta, false);
    }, { passive: true });
    track.addEventListener('touchend', () => {
      track.classList.remove('is-dragging');
      const threshold = cardWidth() * 0.25;
      if (dragDelta < -threshold)      goTo(current + 1);
      else if (dragDelta > threshold)  goTo(current - 1);
      else                             goTo(current);
    });

    carouselObs = new IntersectionObserver(([e]) => {
      carouselInView = e.isIntersecting;
      resetTimer();
    }, { rootMargin: '0px' });
    carouselObs.observe(grid);
    document.addEventListener('visibilitychange', resetTimer);

    goTo(0, false);
  }

  function destroyCarousel() {
    if (!track) return; // ya desmontado
    clearInterval(timer);
    if (resizeHandler) window.removeEventListener('resize', resizeHandler);
    document.removeEventListener('visibilitychange', resetTimer);
    if (carouselObs) { carouselObs.disconnect(); carouselObs = null; }
    carouselInView = false;
    // Devolver cards al grid en su orden original
    cards.forEach(c => {
      c.style.width = '';
      c.style.minWidth = '';
      grid.appendChild(c);
    });
    track.remove();
    track = null;
    if (dotsWrap) { dotsWrap.remove(); dotsWrap = null; }
    current = 0;
  }

  mq.addEventListener('change', e => {
    if (e.matches) initCarousel();
    else destroyCarousel();
  });

  if (mq.matches) initCarousel();
})();

/* ─── Configurar cookies — links del footer ──────────────────────────────── */
document.querySelectorAll('[data-cookie-settings]').forEach(el => {
  el.addEventListener('click', e => {
    if (typeof window.omnexOpenCookieSettings === 'function') {
      e.preventDefault();
      window.omnexOpenCookieSettings();
    }
  });
});
