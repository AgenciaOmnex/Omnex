/* ─── Analytics events — GA4 / GTM ready ───────────────────────────────────
   Para activar el tracking real:
   1. Instala GA4: añade el script de gtag.js en el <head> con tu Measurement ID
      o usa GTM (Google Tag Manager).
   2. Sustituye el console.log de trackEvent por:
      • GA4:  gtag('event', name, params);
      • GTM:  dataLayer.push({ event: name, ...params });
   Eventos configurados: click_cta_hero | click_cta_services | form_submit
   ─────────────────────────────────────────────────────────────────────────── */
function trackEvent(name, params = {}) {
  // gtag('event', name, params);          // GA4
  // dataLayer.push({ event: name, ...params }); // GTM
  console.log('[Analytics]', name, params);
}

document.querySelectorAll('[data-event]').forEach(el => {
  el.addEventListener('click', () => trackEvent(el.dataset.event));
});

/* ─── Page loader ─── */
(function () {
  const loader = document.getElementById('pageLoader');
  function hideLoader() {
    setTimeout(() => {
      loader.classList.add('loaded');
      setTimeout(() => { loader.style.display = 'none'; }, 750);
    }, 1800);
  }
  if (document.readyState === 'complete') { hideLoader(); }
  else { window.addEventListener('load', hideLoader); }
})();

/* ─── Hero dashboard — aparece y anima tras la pantalla de carga ─── */
setTimeout(() => {
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
}, 2800);

/* ─── Navbar scroll effect ─── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

/* ─── Mobile menu toggle ─── */
document.getElementById('navToggle').addEventListener('click', () => {
  navbar.classList.toggle('open');
});
document.querySelectorAll('.nav__links a, .nav__cta a').forEach(link => {
  link.addEventListener('click', () => navbar.classList.remove('open'));
});

/* ─── Fade-in on scroll ─── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

/* En móvil, los pasos de "Cómo funciona" usan un observer propio con
   rootMargin más restrictivo para que cada paso aparezca individualmente
   al hacer scroll, en lugar de todos a la vez. */
const isMob = window.innerWidth <= 768;
const howStepSet = isMob
  ? new Set(document.querySelectorAll('.how__step.fade-in'))
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

/* ─── FAQ accordion ─── */
document.querySelectorAll('.faq__q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq__item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});



/* ─── Problems — auto-scroll táctil (móvil) ─── */
(function () {
  const grid = document.querySelector('.problems__grid');
  if (!grid || window.innerWidth > 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let pos = 0;
  let paused = false;
  const speed = 0.5;

  function tick() {
    if (!paused) {
      pos += speed;
      const half = grid.scrollWidth / 2;
      if (pos >= half) pos -= half;
      grid.scrollLeft = pos;
    }
    requestAnimationFrame(tick);
  }

  grid.addEventListener('touchstart', () => { paused = true; }, { passive: true });
  grid.addEventListener('touchend', () => {
    pos = grid.scrollLeft % (grid.scrollWidth / 2);
    setTimeout(() => { paused = false; }, 1800);
  }, { passive: true });

  requestAnimationFrame(tick);
})();

/* ─── Contact form — borde gira con el ratón ─── */
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

/* ─── Warp canvas — inyectar en cards (WebGL en todos los dispositivos) ─── */
document.querySelectorAll('.problem-card:not(.problem-card--dupe), .trust-card, .industry-card').forEach(el => {
  const bg = document.createElement('canvas');
  bg.className = 'plan__canvas';
  bg.setAttribute('aria-hidden', 'true');
  el.insertBefore(bg, el.firstChild);
});

/* ─── Contact form → Google Sheets ─── */
const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbxFm4pHgUIeEOXi9SIg-F7krQy9s0qALVZgglCPYoUfx0_vxuw4Il0qhggC60kwGUVs/exec';

const form      = document.getElementById('contactForm');
const submitBtn = form.querySelector('.form__submit');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  trackEvent('form_submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';
  const payload = {
    fecha:     new Date().toLocaleString('es-ES'),
    nombre:    form.nombre.value,
    negocio:   form.negocio.value,
    telefono:  form.telefono.value,
    email:     form.email.value,
    necesidad: form.necesidad.value,
    mensaje:   form.mensaje.value
  };
  try {
    await fetch(SHEETS_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });
    form.reset();
    const success = document.getElementById('formSuccess');
    success.style.display = 'block';
    setTimeout(() => { success.style.display = 'none'; }, 6000);
  } catch (err) {
    console.error('Error al enviar formulario:', err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Enviar solicitud →';
  }
});

/* ── Cards WebGL shader — vertex displacement + noise glow (desktop) ── */
(function () {
  const allCanvases = document.querySelectorAll('.plan__canvas');
  if (!allCanvases.length) return;

  /* En móvil, los gradientes CSS gestionan el fondo de las cards.
     WebGL requiere GPU readback por cada drawImage (~30 calls/frame)
     lo que degrada el scroll y la respuesta táctil en dispositivos móviles. */
  if (window.innerWidth <= 768) return;

  const PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Canvas WebGL compartido en DOM — necesario para que iOS Safari
     permita leer sus píxeles vía drawImage */
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

  /* Vertex shader — desplazamiento ondulante de la malla (32×32 subdivisiones) */
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

  /* Fragment shader — ruido animado + mezcla de colores + glow central */
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

      vec3 c1 = vec3(0.486, 0.227, 0.929); /* #7C3AED */
      vec3 c2 = vec3(0.753, 0.149, 0.827); /* #C026D3 */
      vec3 color = mix(c1, c2, noise * 0.5 + 0.5);
      color = mix(color, vec3(0.88, 0.50, 0.99), pow(abs(noise), 2.0) * intensity * 0.5);

      float glow = clamp(1.0 - length(uv - 0.5) * 2.0, 0.0, 1.0);
      glow = pow(glow, 1.5);

      vec3 bg = vec3(0.035, 0.016, 0.070); /* borde oscuro */
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

  /* Malla 16×16 para que el vertex shader desplace vértices visiblemente */
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
  let start = performance.now(), last = 0, raf;

  function frame(now) {
    if (now - last >= TARGET) { last = now; renderAll((now - start) * 0.001); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(frame);
  });
})();


/* ─── Barra de progreso de scroll ─── */
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

/* ─── Nav: enlace activo según sección más centrada en pantalla ─── */
(function () {
  const pairs = ['problemas', 'Servicios', 'faq'].map(id => ({
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

/* ─── Hero card: tilt 3D sutil en hover (solo desktop, post-reveal) ─── */
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

  /* Esperar a que complete la animación de entrada de la card (2800ms + 1100ms) */
  setTimeout(() => {
    wrap.addEventListener('mousemove', onMove, { passive: true });
    wrap.addEventListener('mouseleave', onLeave);
  }, 4100);
})();

/* ─── Stats ticker: animación JS con desaceleración suave en hover ─── */
(function () {
  const wrap  = document.querySelector('.stats-ticker');
  const track = document.querySelector('.stats-ticker__track');
  if (!wrap || !track) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let pos         = 0;
  let speed       = 1;      // px por frame
  let targetSpeed = 1;
  let halfWidth   = 0;

  function tick() {
    if (!halfWidth) halfWidth = track.scrollWidth / 2;

    speed += (targetSpeed - speed) * 0.055;   // lerp → easing suave

    pos -= speed;
    if (Math.abs(pos) >= halfWidth) pos += halfWidth;

    track.style.transform = `translateX(${pos}px)`;
    requestAnimationFrame(tick);
  }

  wrap.addEventListener('mouseenter', () => { targetSpeed = 0; });
  wrap.addEventListener('mouseleave', () => { targetSpeed = 1; });

  requestAnimationFrame(tick);
})();
