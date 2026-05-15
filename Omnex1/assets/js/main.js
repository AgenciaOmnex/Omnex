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

/* ─── Servicios — accordion desplegable en móvil ─── */
if (window.innerWidth <= 768) {
  document.querySelectorAll('#soluciones .plan').forEach(plan => {
    /* Chevron SVG tras el subtítulo ideal */
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('plan__chevron');
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    poly.setAttribute('points', '6 9 12 15 18 9');
    svg.appendChild(poly);
    plan.querySelector('.plan__ideal').after(svg);

    plan.addEventListener('click', () => {
      const isOpen = plan.classList.contains('plan--open');
      document.querySelectorAll('#soluciones .plan').forEach(p => p.classList.remove('plan--open'));
      if (!isOpen) plan.classList.add('plan--open');
    });
  });
}

/* ─── Floating chat bubble — aparece a los 5s ─── */
const chatBtn    = document.getElementById('chatBtn');
const chatBubble = document.getElementById('chatBubble');
let bubbleVisible = false;

setTimeout(() => {
  chatBubble.classList.add('bubble-show');
  bubbleVisible = true;
}, 5000);

chatBtn.addEventListener('click', () => {
  if (bubbleVisible) {
    chatBubble.classList.remove('bubble-show');
    chatBubble.classList.add('hidden');
    bubbleVisible = false;
  }
  document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => { document.getElementById('nombre').focus(); }, 700);
});

document.getElementById('chatClose').addEventListener('click', (e) => {
  e.stopPropagation();
  chatBubble.classList.remove('bubble-show');
  chatBubble.classList.add('hidden');
  bubbleVisible = false;
});

/* ─── Stats — auto-scroll táctil (móvil) ─── */
(function () {
  const inner = document.querySelector('.stats__inner');
  if (!inner || window.innerWidth > 768) return;

  let pos = 0;
  let paused = false;
  const speed = 0.6; // px/frame

  function tick() {
    if (!paused) {
      pos += speed;
      const half = inner.scrollWidth / 2;
      if (pos >= half) pos -= half;
      inner.scrollLeft = pos;
    }
    requestAnimationFrame(tick);
  }

  inner.addEventListener('touchstart', () => { paused = true; }, { passive: true });
  inner.addEventListener('touchend', () => {
    pos = inner.scrollLeft % (inner.scrollWidth / 2);
    setTimeout(() => { paused = false; }, 1800);
  }, { passive: true });

  requestAnimationFrame(tick);
})();

/* ─── Problems — auto-scroll táctil (móvil) ─── */
(function () {
  const grid = document.querySelector('.problems__grid');
  if (!grid || window.innerWidth > 768) return;

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

/* ─── Warp canvas — inyectar en cards sin canvas estático ─── */
document.querySelectorAll('.problem-card, .trust-card, .industry-card').forEach(el => {
  const canvas = document.createElement('canvas');
  canvas.className = 'plan__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  el.insertBefore(canvas, el.firstChild);
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

/* ── Cards WebGL warp shader (canvas compartido → copia a N tarjetas) ───── */
(function () {
  const allCanvases = document.querySelectorAll('.plan__canvas');
  if (!allCanvases.length) return;

  const PRM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Canvas WebGL compartido — no va al DOM */
  const SIZE = 256;
  const shared = document.createElement('canvas');
  shared.width = SIZE; shared.height = SIZE;

  const gl = shared.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true })
          || shared.getContext('experimental-webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!gl) return;

  const vs = `attribute vec2 a_pos; void main() { gl_Position = vec4(a_pos,0.0,1.0); }`;

  /* Domain-warped fBm — u_seed desplaza el espacio UV por tarjeta */
  const fs = `
    precision mediump float;
    uniform float u_t;
    uniform vec2  u_seed;

    float hash(vec2 p){p=fract(p*vec2(234.34,435.345));p+=dot(p,p+34.23);return fract(p.x*p.y);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
    float fbm(vec2 p){float v=0.0,a=0.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.1+vec2(1.31,1.72);a*=0.5;}return v;}

    void main(){
      vec2 uv = gl_FragCoord.xy / vec2(${SIZE}.0);
      uv = uv * 2.0 - 1.0;
      uv += u_seed;

      float t = u_t * 0.10;
      vec2 q = vec2(fbm(uv+t), fbm(uv+vec2(5.2,1.3)-t*0.7));
      vec2 r = vec2(fbm(uv+4.0*q+vec2(1.7,9.2)+t*0.4), fbm(uv+4.0*q+vec2(8.3,2.8)-t*0.3));
      float f = fbm(uv + 3.2*r);

      vec3 c0=vec3(0.02,0.01,0.07); vec3 c1=vec3(0.18,0.07,0.45);
      vec3 c2=vec3(0.49,0.23,0.93); vec3 c3=vec3(0.70,0.18,0.82);
      vec3 c4=vec3(0.38,0.22,0.72);

      vec3 col=mix(c0,c1,smoothstep(0.0,0.35,f));
      col=mix(col,c2,smoothstep(0.30,0.58,f));
      col=mix(col,c3,smoothstep(0.54,0.78,f));
      col=mix(col,c4,smoothstep(0.74,1.0,f));
      gl_FragColor=vec4(col,1.0);
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

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uT    = gl.getUniformLocation(prog, 'u_t');
  const uSeed = gl.getUniformLocation(prog, 'u_seed');

  gl.viewport(0, 0, SIZE, SIZE);

  /* Semilla espacial única por tarjeta para que cada una muestre una región distinta */
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

  function renderAll(t) {
    gl.uniform1f(uT, t);
    ctxs.forEach((ctx, i) => {
      gl.uniform2f(uSeed, seeds[i][0], seeds[i][1]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      ctx.drawImage(shared, 0, 0, ctx.canvas.width, ctx.canvas.height);
    });
  }

  if (PRM) { renderAll(0); return; }

  const TARGET = 1000 / 30; /* tope 30 fps — equilibrio calidad/rendimiento */
  let start = performance.now(), last = 0, raf;

  function frame(now) {
    if (now - last >= TARGET) { last = now; renderAll((now - start) * 0.001); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); }
    else { raf = requestAnimationFrame(frame); }
  });
})();

/* ─── Mini-form de contacto rápido ─── */
(function () {
  const miniForm = document.getElementById('miniContactForm');
  if (!miniForm) return;

  const miniSuccess = document.getElementById('miniFormSuccess');
  const miniBtn = miniForm.querySelector('button[type="submit"]');

  miniForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    trackEvent('mini_form_submit');
    miniBtn.disabled = true;
    miniBtn.textContent = 'Enviando…';

    const payload = {
      fecha:    new Date().toLocaleString('es-ES'),
      nombre:   miniForm.nombre.value,
      telefono: miniForm.telefono.value,
      origen:   'mini-form'
    };

    try {
      await fetch(SHEETS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
        mode: 'no-cors'
      });
      miniForm.reset();
      miniSuccess.style.display = 'block';
      setTimeout(() => { miniSuccess.style.display = 'none'; }, 6000);
    } catch (err) {
      console.error('Error al enviar mini-form:', err);
    } finally {
      miniBtn.disabled = false;
      miniBtn.innerHTML = 'Te llamamos →';
    }
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
  const pairs = ['problemas', 'soluciones', 'faq'].map(id => ({
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
