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

/* ─── Hero chat card — aparece tras la pantalla de carga ─── */
setTimeout(() => {
  const card = document.querySelector('.hero__card-wrap');
  if (card) card.classList.add('card-visible');
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
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

/* ─── FAQ accordion ─── */
document.querySelectorAll('.faq__q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq__item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

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

/* ─── Contact form → Google Sheets ─── */
const SHEETS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbxFm4pHgUIeEOXi9SIg-F7krQy9s0qALVZgglCPYoUfx0_vxuw4Il0qhggC60kwGUVs/exec';

const form      = document.getElementById('contactForm');
const submitBtn = form.querySelector('.form__submit');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
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
    submitBtn.innerHTML = 'Enviar mensaje →';
  }
});
