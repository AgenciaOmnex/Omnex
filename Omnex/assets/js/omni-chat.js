/* ─── CHAT OMNI ───────────────────────────────────────────────────────────────
   Cargado con defer desde index.html.
   Se inicializa solo tras consentimiento de cookies (omnex:consent-accepted).
   ─────────────────────────────────────────────────────────────────────────── */

function initOmniChat() {
  'use strict';

  /* ── CONFIGURACIÓN ──────────────────────────────────────────── */
  const CFG = {
    webhookUrl: 'https://agencia-n8n.oyvucf.easypanel.host/webhook/fb7d9697-c7f2-459d-b62d-a07557e6f4e9',
    sheetsUrl:  'https://script.google.com/macros/s/AKfycbxUMK41QDFdfOx0tVOeCOugK0DdPv7ZpJJfaY-Q2c_if_4s7Z05qc7YiLJ1HERI5Oi_/exec',
    token:      'omnex-chat-2025',
    botName:    'Omni',
    maxHistory: 6,
  };

  /* ── ESTADO ─────────────────────────────────────────────────── */
  let isOpen = false;
  let conversationId = 'conv_' + Date.now();
  let history = [];

  /* ── CSS ────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `
    /* ── Bubble ─────────────────────────────────────── */
    #omni-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 58px; height: 58px; border-radius: 50%;
      background: linear-gradient(135deg, #76138D, #BB35BE);
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(118,19,141,.55);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transform: translateY(16px) scale(.8);
      pointer-events: none;
      transition: transform .2s, box-shadow .2s;
    }
    #omni-bubble.omni-bubble--in {
      animation: omniBubbleReveal .6s cubic-bezier(.34,1.56,.64,1) forwards;
      pointer-events: all;
    }
    #omni-bubble.omni-bubble--ready {
      opacity: 1; transform: none; pointer-events: all;
    }
    @keyframes omniBubbleReveal {
      to { opacity: 1; transform: none; }
    }
    #omni-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(187,53,190,.7), 0 0 0 8px rgba(187,53,190,.1);
    }
    #omni-bubble svg { width: 24px; height: 24px; fill: #fff; }
    #omni-bubble::before {
      content: '';
      position: absolute; inset: 0; border-radius: 50%;
      background: rgba(187,53,190,.45);
      z-index: -1; pointer-events: none;
      animation: omniRingPulse 2.4s ease-out 0s 4;
      animation-play-state: paused;
    }
    #omni-bubble.omni-bubble--ready::before {
      animation-play-state: running;
    }
    @keyframes omniRingPulse {
      0%   { transform: scale(1);   opacity: .55; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* ── Callout ─────────────────────────────────────── */
    #omni-callout {
      position: fixed;
      bottom: 98px; right: 16px; z-index: 9998;
      max-width: 230px;
      background: rgba(13,13,20,0.96);
      backdrop-filter: blur(14px) saturate(150%);
      -webkit-backdrop-filter: blur(14px) saturate(150%);
      border: 1px solid rgba(118,19,141,.3);
      border-bottom: 3px solid #BB35BE;
      border-radius: 10px 10px 0 10px;
      padding: 12px 28px 12px 14px;
      box-shadow: 0 6px 24px rgba(0,0,0,.55), 0 0 20px rgba(118,19,141,.12);
      opacity: 0;
      transform: translateY(8px) scale(.96);
      transition: opacity .3s ease, transform .3s ease;
      pointer-events: none;
      cursor: pointer;
    }
    #omni-callout.omni-callout--visible {
      opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;
    }
    #omni-callout::after {
      content: '';
      position: absolute;
      bottom: -9px; right: 18px;
      width: 0; height: 0;
      border-left: 8px solid transparent;
      border-right: 0 solid transparent;
      border-top: 8px solid #BB35BE;
    }
    #omni-callout p {
      margin: 0;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12.5px;
      color: rgba(255,255,255,.88);
      line-height: 1.5;
    }
    #omni-callout strong {
      display: block;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 11px; font-weight: 700;
      letter-spacing: 1.4px; text-transform: uppercase;
      color: #BB35BE; margin-bottom: 5px;
    }
    #omni-callout-close {
      position: absolute; top: 7px; right: 8px;
      width: 18px; height: 18px;
      background: transparent; border: none;
      color: rgba(255,255,255,.35); font-size: 14px;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      line-height: 1; padding: 0; transition: color .15s;
    }
    #omni-callout-close:hover { color: rgba(255,255,255,.8); }
    @media (max-width: 480px) {
      #omni-callout { max-width: 180px; right: 10px; font-size: 11.5px; }
    }

    /* ── Badge ───────────────────────────────────────── */
    #omni-badge {
      position: absolute; top: -4px; right: -4px;
      width: 18px; height: 18px; border-radius: 50%;
      background: #e53935; color: #fff; font-size: 11px;
      font-family: 'Inter', system-ui, sans-serif; font-weight: 700;
      display: none; align-items: center; justify-content: center;
      pointer-events: none;
    }

    /* ── Ventana ─────────────────────────────────────── */
    #omni-window {
      position: fixed; bottom: 92px; right: 24px; z-index: 9998;
      width: 360px; height: 520px;
      min-width: 280px; min-height: 300px;
      max-width: min(640px, 90vw); max-height: calc(100vh - 110px);
      background: #0D0D14;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 18px;
      box-shadow: 0 24px 64px rgba(0,0,0,.65),
                  0 0 0 1px rgba(118,19,141,.2),
                  0 0 48px rgba(118,19,141,.08);
      display: flex; flex-direction: column;
      font-family: 'Inter', system-ui, sans-serif; font-size: 14px;
      overflow: hidden;
      transform-origin: bottom right;
      transition: opacity .28s cubic-bezier(.22,1,.36,1),
                  transform .28s cubic-bezier(.22,1,.36,1);
      opacity: 0; transform: translateY(14px) scale(.97); pointer-events: none;
    }
    #omni-window.open { opacity: 1; transform: none; pointer-events: all; }

    /* ── Resize handles ──────────────────────────────── */
    .omni-resize { position: absolute; z-index: 100; background: transparent; }
    [data-omni-dir="n"]  { top: 0; left: 8px; right: 8px; height: 5px; cursor: n-resize; }
    [data-omni-dir="s"]  { bottom: 0; left: 8px; right: 8px; height: 5px; cursor: s-resize; }
    [data-omni-dir="e"]  { right: 0; top: 8px; bottom: 8px; width: 5px; cursor: e-resize; }
    [data-omni-dir="w"]  { left: 0; top: 8px; bottom: 8px; width: 5px; cursor: w-resize; }
    [data-omni-dir="ne"] { top: 0; right: 0; width: 10px; height: 10px; cursor: ne-resize; }
    [data-omni-dir="nw"] { top: 0; left: 0; width: 10px; height: 10px; cursor: nw-resize; }
    [data-omni-dir="se"] { bottom: 0; right: 0; width: 10px; height: 10px; cursor: se-resize; }
    [data-omni-dir="sw"] { bottom: 0; left: 0; width: 10px; height: 10px; cursor: sw-resize; }
    @media (max-width: 768px) {
      [data-omni-dir="n"], [data-omni-dir="s"] { height: 14px; }
      [data-omni-dir="e"], [data-omni-dir="w"] { width: 14px; }
      [data-omni-dir="ne"],[data-omni-dir="nw"],
      [data-omni-dir="se"],[data-omni-dir="sw"] { width: 22px; height: 22px; }
    }

    /* ── Header ──────────────────────────────────────── */
    #omni-header {
      background: linear-gradient(135deg, #76138D 0%, #BB35BE 100%);
      padding: 15px 18px;
      display: flex; align-items: center; gap: 12px;
      position: relative; overflow: hidden; flex-shrink: 0;
    }
    #omni-header::before {
      content: '';
      position: absolute; inset: 0;
      background-image: radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px);
      background-size: 18px 18px;
      pointer-events: none;
    }
    #omni-header .avatar {
      position: relative; z-index: 1; flex-shrink: 0;
      width: 36px; height: 36px; border-radius: 50%;
      background: #050509;
      border: 2px solid rgba(255,255,255,.35);
      display: flex; align-items: center; justify-content: center;
    }
    #omni-header .avatar::after {
      content: '';
      position: absolute; bottom: 0; right: -1px;
      width: 11px; height: 11px; border-radius: 50%;
      background: #4ade80;
      border: 2px solid #8B2BE2;
    }
    #omni-header .info { position: relative; z-index: 1; }
    #omni-header .info .name  { font-weight: 700; font-size: 15px; color: #fff; letter-spacing: -.01em; }
    #omni-header .info .status { font-size: 11px; color: rgba(255,255,255,.75); margin-top: 1px; }
    #omni-close {
      margin-left: auto; position: relative; z-index: 1; flex-shrink: 0;
      background: rgba(255,255,255,.15); border: none; color: #fff; cursor: pointer;
      width: 28px; height: 28px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; line-height: 1;
      transition: background .15s;
    }
    #omni-close:hover { background: rgba(255,255,255,.3); }

    /* ── Mensajes ────────────────────────────────────── */
    #omni-messages {
      flex: 1; overflow-y: auto; padding: 18px 16px;
      display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
      background-image: radial-gradient(rgba(118,19,141,.1) 1px, transparent 1px);
      background-size: 24px 24px;
    }
    #omni-messages::-webkit-scrollbar { width: 4px; }
    #omni-messages::-webkit-scrollbar-track { background: transparent; }
    #omni-messages::-webkit-scrollbar-thumb { background: rgba(118,19,141,.4); border-radius: 4px; }
    #omni-messages::-webkit-scrollbar-thumb:hover { background: rgba(187,53,190,.6); }

    .omni-msg {
      max-width: 84%; padding: 10px 14px; border-radius: 14px;
      line-height: 1.55; word-break: break-word; font-size: 13.5px;
      animation: omniMsgIn .22s cubic-bezier(.22,1,.36,1) both;
    }
    @keyframes omniMsgIn {
      from { opacity: 0; transform: translateY(8px) scale(.97); }
      to   { opacity: 1; transform: none; }
    }
    .omni-msg.bot {
      background: #1E1E2E;
      border: 1px solid rgba(118,19,141,.25);
      color: #EEEEFF; align-self: flex-start;
      border-bottom-left-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,.35);
    }
    .omni-msg.user {
      background: linear-gradient(135deg, #76138D, #BB35BE);
      color: #fff; align-self: flex-end;
      border-bottom-right-radius: 4px;
      box-shadow: 0 2px 12px rgba(118,19,141,.4);
    }
    .omni-msg strong { font-weight: 700; }

    /* ── Typing dots ─────────────────────────────────── */
    .omni-dots { display: flex; gap: 5px; align-items: center; height: 18px; }
    .omni-dots span {
      width: 7px; height: 7px; border-radius: 50%;
      background: linear-gradient(135deg, #76138D, #BB35BE);
      animation: omniDot .9s ease-in-out infinite;
    }
    .omni-dots span:nth-child(2) { animation-delay: .15s; }
    .omni-dots span:nth-child(3) { animation-delay: .3s; }
    @keyframes omniDot {
      0%, 60%, 100% { transform: translateY(0); opacity: .45; }
      30%            { transform: translateY(-6px); opacity: 1; }
    }

    /* ── Sugerencias ─────────────────────────────────── */
    .omni-suggestions {
      display: flex; flex-wrap: wrap; gap: 6px;
      max-width: 84%; align-self: flex-start; margin-top: -3px;
    }
    .omni-suggestion {
      background: rgba(44,26,78,.8);
      color: #C050C0;
      border: 1px solid rgba(118,19,141,.38);
      border-radius: 999px; padding: 5px 13px;
      font-size: 12px; cursor: pointer; white-space: nowrap;
      font-family: inherit;
      transition: background .15s, border-color .15s, transform .1s;
      animation: omniMsgIn .22s cubic-bezier(.22,1,.36,1) both;
    }
    .omni-suggestion:hover {
      background: rgba(118,19,141,.28);
      border-color: rgba(187,53,190,.6);
      transform: translateY(-1px);
    }

    /* ── Input ───────────────────────────────────────── */
    #omni-input-area {
      padding: 12px 14px; background: #0D0D14;
      border-top: 1px solid rgba(255,255,255,.06);
      display: flex; gap: 8px; align-items: flex-end;
      position: relative; flex-shrink: 0;
    }
    #omni-input-area::before {
      content: '';
      position: absolute; top: 0; left: 20px; right: 20px; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(118,19,141,.5), rgba(187,53,190,.5), transparent);
    }
    #omni-input {
      flex: 1;
      background: #050509;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 10px; padding: 9px 13px;
      font-size: 13.5px; resize: none; max-height: 100px;
      outline: none; line-height: 1.45;
      font-family: 'Inter', system-ui, sans-serif;
      color: #EEEEFF;
      transition: border-color .2s, box-shadow .2s;
    }
    #omni-input::placeholder { color: #4B5563; }
    #omni-input:focus {
      border-color: rgba(118,19,141,.65);
      box-shadow: 0 0 0 3px rgba(118,19,141,.15);
    }
    #omni-send {
      width: 38px; height: 38px; flex-shrink: 0;
      background: linear-gradient(135deg, #76138D, #BB35BE);
      border: none; border-radius: 10px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: filter .15s, transform .15s;
      box-shadow: 0 2px 10px rgba(118,19,141,.45);
    }
    #omni-send:hover { filter: brightness(1.12); transform: scale(1.06); }
    #omni-send svg { width: 17px; height: 17px; fill: #fff; }
    #omni-send:disabled {
      background: #2D2D3A; box-shadow: none;
      cursor: not-allowed; transform: none; filter: none;
    }

    /* ── Responsive ──────────────────────────────────── */
    @media (max-width: 768px) {
      #omni-window {
        width: calc(100vw - 20px);
        height: min(460px, calc(100vh - 100px));
        max-height: calc(100vh - 100px);
        right: 10px; bottom: 80px;
      }
    }
    @media (max-width: 420px) {
      #omni-bubble { bottom: 16px; right: 12px; }
      #omni-callout { bottom: 88px; }
    }
    @media (max-height: 500px) {
      #omni-window  { bottom: 70px; max-height: calc(100vh - 86px); }
      #omni-bubble  { bottom: 14px; }
      #omni-callout { bottom: 76px; }
    }

    /* ── Reduced motion ──────────────────────────────── */
    @media (prefers-reduced-motion: reduce) {
      #omni-bubble::before        { animation: none; }
      .omni-msg, .omni-suggestion { animation: none; }
      .omni-dots span             { animation: none; opacity: .7; }
    }
  `;
  document.head.appendChild(style);

  /* ── HTML ───────────────────────────────────────────────────── */
  document.getElementById('omni-chat-root').innerHTML = `
    <div id="omni-window">
      <div class="omni-resize" data-omni-dir="n"></div>
      <div class="omni-resize" data-omni-dir="ne"></div>
      <div class="omni-resize" data-omni-dir="e"></div>
      <div class="omni-resize" data-omni-dir="se"></div>
      <div class="omni-resize" data-omni-dir="s"></div>
      <div class="omni-resize" data-omni-dir="sw"></div>
      <div class="omni-resize" data-omni-dir="w"></div>
      <div class="omni-resize" data-omni-dir="nw"></div>
      <div id="omni-header">
        <div class="avatar"><img src="assets/img/Logo_pentagono-removebg-preview.webp" alt="Omnex" width="32" height="32" style="display:block;width:32px;height:32px;object-fit:contain;" /></div>
        <div class="info">
          <div class="name">${CFG.botName}</div>
          <div class="status">Asistente de Omnex · en línea</div>
        </div>
        <button id="omni-close" aria-label="Cerrar chat">×</button>
      </div>
      <div id="omni-messages"></div>
      <div id="omni-input-area">
        <textarea id="omni-input" rows="1" placeholder="Escribe tu mensaje..."></textarea>
        <button id="omni-send" aria-label="Enviar">
          <svg viewBox="0 0 24 24"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
    <button id="omni-bubble" aria-label="Abrir chat con Omni">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
      <div id="omni-badge" aria-hidden="true">1</div>
    </button>
  `;

  /* ── REFERENCIAS DOM ────────────────────────────────────────── */
  const win      = document.getElementById('omni-window');
  const bubble   = document.getElementById('omni-bubble');
  const closeBtn = document.getElementById('omni-close');
  const messages = document.getElementById('omni-messages');
  const input    = document.getElementById('omni-input');
  const sendBtn  = document.getElementById('omni-send');

  /* ── HELPERS ────────────────────────────────────────────────── */
  function parseMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, (_, label, url) => {
        if (url.includes('#contacto')) {
          return `<a href="#contacto" onclick="event.preventDefault();document.querySelector('#contacto')?.scrollIntoView({behavior:'smooth'})" style="color:#C050C0;font-weight:600;text-decoration:underline;">${label}</a>`;
        }
        return `<a href="${url}" target="_blank" rel="noopener" style="color:#C050C0;font-weight:600;text-decoration:underline;">${label}</a>`;
      })
      .replace(/\n/g, '<br>');
  }

  function addMessage(text, role, suggestions) {
    const div = document.createElement('div');
    div.className = 'omni-msg ' + role;
    if (role === 'bot typing') {
      div.innerHTML = '<div class="omni-dots"><span></span><span></span><span></span></div>';
    } else {
      div.innerHTML = parseMarkdown(text);
    }
    messages.appendChild(div);

    if (suggestions && suggestions.length) {
      const sg = document.createElement('div');
      sg.className = 'omni-suggestions';
      suggestions.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'omni-suggestion';
        btn.textContent = s;
        btn.onclick = () => {
          if (s.toLowerCase().includes('propuesta')) {
            document.querySelector('#contacto')?.scrollIntoView({ behavior: 'smooth' });
          } else {
            sg.remove();
            sendMessage(s);
          }
        };
        sg.appendChild(btn);
      });
      messages.appendChild(sg);
    }

    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function setLoading(on) {
    sendBtn.disabled = on;
    input.disabled   = on;
  }

  /* ── ENVIAR MENSAJE ─────────────────────────────────────────── */
  async function sendMessage(text) {
    text = text.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';
    addMessage(text, 'user');

    const typingEl = addMessage('', 'bot typing');
    setLoading(true);

    try {
      const res = await fetch(CFG.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-chat-token': CFG.token,
        },
        body: JSON.stringify({
          message: text,
          conversationId,
          history: history.slice(-CFG.maxHistory),
        }),
      });

      const data = await res.json();
      typingEl.remove();

      const reply = data.reply || 'Algo salió mal. Inténtalo de nuevo.';
      addMessage(reply, 'bot', data.suggestions);

      fetch(CFG.sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          tipo:           'chat',
          fecha:          new Date().toLocaleString('es-ES'),
          conversationId,
          pregunta:       text,
          respuesta:      reply,
        }),
        mode: 'no-cors',
      }).catch(() => {});

      history.push({ role: 'user',      content: text  });
      history.push({ role: 'assistant', content: reply });
      if (history.length > CFG.maxHistory * 2) history = history.slice(-CFG.maxHistory * 2);

    } catch (err) {
      typingEl.remove();
      addMessage('No pude conectar con el asistente. Por favor, intenta de nuevo en unos segundos.', 'bot');
    }

    setLoading(false);
    input.focus();
  }

  /* ── CALLOUT ────────────────────────────────────────────────── */
  (function () {
    const callout      = document.getElementById('omni-callout');
    const closeCallout = document.getElementById('omni-callout-close');
    if (!callout) return;
    let dismissed = false;

    setTimeout(() => {
      if (!dismissed) callout.classList.add('omni-callout--visible');
    }, 9000);

    callout.addEventListener('click', e => {
      if (e.target === closeCallout) return;
      callout.classList.remove('omni-callout--visible');
      bubble.click();
    });
    callout.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      callout.classList.remove('omni-callout--visible');
      bubble.click();
    });
    closeCallout.addEventListener('click', e => {
      e.stopPropagation();
      dismissed = true;
      callout.classList.remove('omni-callout--visible');
    });
  })();

  /* ── BADGE ──────────────────────────────────────────────────── */
  const badge = document.getElementById('omni-badge');
  setTimeout(() => {
    if (!isOpen && badge) badge.style.display = 'flex';
  }, 5000);

  /* ── EVENTOS ────────────────────────────────────────────────── */
  bubble.addEventListener('click', () => {
    isOpen = !isOpen;
    win.classList.toggle('open', isOpen);
    if (badge) badge.style.display = 'none';
    document.getElementById('omni-callout')?.classList.remove('omni-callout--visible');
    if (isOpen && messages.children.length === 0) {
      addMessage(
        '¡Hola! Soy **Omni**, el asistente de Omnex 👋\n\n¿En qué puedo ayudarte hoy?',
        'bot',
        ['¿Qué servicios ofrecéis?', '¿Cómo funciona el proceso?', 'Pedir propuesta']
      );
      setTimeout(() => input.focus(), 100);
    }
  });

  closeBtn.addEventListener('click', () => {
    isOpen = false;
    win.classList.remove('open');
  });

  sendBtn.addEventListener('click', () => sendMessage(input.value));

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input.value); }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  });

  /* ── RESIZE ─────────────────────────────────────────────────── */
  (function () {
    const MIN_W = 280, MIN_H = 320, MAX_W = 640;

    win.querySelectorAll('[data-omni-dir]').forEach(handle => {
      function startResize(clientX, clientY) {
        const dir    = handle.dataset.omniDir;
        const rect   = win.getBoundingClientRect();
        const startX = clientX, startY = clientY;
        const startW = rect.width,  startH = rect.height;
        const startL = rect.left,   startT = rect.top;
        const maxH   = window.innerHeight * 0.85;

        win.style.left   = startL + 'px';
        win.style.top    = startT + 'px';
        win.style.right  = 'auto';
        win.style.bottom = 'auto';
        win.style.transition = 'opacity .28s cubic-bezier(.22,1,.36,1)';

        function applyResize(cx, cy) {
          const dx = cx - startX, dy = cy - startY;
          let newW = startW, newH = startH, newL = startL, newT = startT;

          if (dir.indexOf('e') !== -1) newW = Math.min(MAX_W, Math.max(MIN_W, startW + dx));
          if (dir.indexOf('s') !== -1) newH = Math.min(maxH,  Math.max(MIN_H, startH + dy));
          if (dir.indexOf('w') !== -1) { newW = Math.min(MAX_W, Math.max(MIN_W, startW - dx)); newL = startL + (startW - newW); }
          if (dir.indexOf('n') !== -1) { newH = Math.min(maxH,  Math.max(MIN_H, startH - dy)); newT = startT + (startH - newH); }

          win.style.width  = newW + 'px';
          win.style.height = newH + 'px';
          win.style.left   = newL + 'px';
          win.style.top    = newT + 'px';
        }

        function endResize() {
          win.style.transition = 'opacity .28s cubic-bezier(.22,1,.36,1), transform .28s cubic-bezier(.22,1,.36,1)';
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup',   onUp);
          document.removeEventListener('touchmove', onTouchMove);
          document.removeEventListener('touchend',  onTouchEnd);
        }

        function onMove(e)      { applyResize(e.clientX, e.clientY); }
        function onUp()         { endResize(); }
        function onTouchMove(e) { e.preventDefault(); applyResize(e.touches[0].clientX, e.touches[0].clientY); }
        function onTouchEnd()   { endResize(); }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
        document.addEventListener('touchmove', onTouchMove, { passive: false });
        document.addEventListener('touchend',  onTouchEnd);
      }

      handle.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); startResize(e.clientX, e.clientY); });
      handle.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); startResize(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768 || !win.style.left) {
        ['left','top','right','bottom','width','height'].forEach(p => win.style.removeProperty(p));
        win.style.transition = 'opacity .28s cubic-bezier(.22,1,.36,1), transform .28s cubic-bezier(.22,1,.36,1)';
        return;
      }
      const vw = window.innerWidth, vh = window.innerHeight;
      const w = win.offsetWidth, h = win.offsetHeight;
      let l = parseFloat(win.style.left) || 0;
      let t = parseFloat(win.style.top)  || 0;
      win.style.left = Math.max(8, Math.min(vw - w - 8, l)) + 'px';
      win.style.top  = Math.max(8, Math.min(vh - h - 8, t)) + 'px';
    });
  })();

  /* ── Mostrar bubble tras el loader ──────────────────────────── */
  (function revealBubble() {
    function show() {
      bubble.classList.add('omni-bubble--in');
      setTimeout(() => {
        bubble.classList.remove('omni-bubble--in');
        bubble.classList.add('omni-bubble--ready');
      }, 650);
    }

    const loader = document.getElementById('pageLoader');
    if (!loader) { setTimeout(show, 300); return; }

    if (loader.classList.contains('loaded')) { setTimeout(show, 400); return; }

    const observer = new MutationObserver(() => {
      if (loader.classList.contains('loaded')) {
        observer.disconnect();
        setTimeout(show, 400);
      }
    });
    observer.observe(loader, { attributes: true, attributeFilter: ['class'] });
  })();

}

/* ── ESTADO BLOQUEADO ────────────────────────────────────────────────────────
   Se muestra cuando el usuario no ha aceptado las cookies funcionales.
   La burbuja es visualmente idéntica a la del chat real. Al pulsarla abre un
   panel que explica el motivo y ofrece acceso directo a la configuración.
   ─────────────────────────────────────────────────────────────────────────── */
function initBlockedChat() {
  const style = document.createElement('style');
  style.id = 'omni-blocked-style';
  style.textContent = `
    #omni-bubble {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      width: 58px; height: 58px; border-radius: 50%;
      background: linear-gradient(135deg, #76138D, #BB35BE);
      border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(118,19,141,.55);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transform: translateY(16px) scale(.8);
      pointer-events: none; transition: transform .2s, box-shadow .2s;
    }
    #omni-bubble.omni-bubble--in {
      animation: omniBubbleReveal .6s cubic-bezier(.34,1.56,.64,1) forwards;
      pointer-events: all;
    }
    #omni-bubble.omni-bubble--ready { opacity: 1; transform: none; pointer-events: all; }
    @keyframes omniBubbleReveal { to { opacity: 1; transform: none; } }
    #omni-bubble:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 28px rgba(187,53,190,.7), 0 0 0 8px rgba(187,53,190,.1);
    }
    #omni-bubble svg { width: 24px; height: 24px; fill: #fff; }
    #omni-bubble::before {
      content: ''; position: absolute; inset: 0; border-radius: 50%;
      background: rgba(187,53,190,.45); z-index: -1; pointer-events: none;
      animation: omniRingPulse 2.4s ease-out 0s 4; animation-play-state: paused;
    }
    #omni-bubble.omni-bubble--ready::before { animation-play-state: running; }
    @keyframes omniRingPulse {
      0%   { transform: scale(1);   opacity: .55; }
      100% { transform: scale(2.2); opacity: 0;   }
    }
    #omni-blocked-panel {
      position: fixed; bottom: 92px; right: 24px; z-index: 9998;
      width: 288px; background: #0D0D14;
      border: 1px solid rgba(255,255,255,.08); border-radius: 18px;
      box-shadow: 0 24px 64px rgba(0,0,0,.65),
                  0 0 0 1px rgba(118,19,141,.2),
                  0 0 48px rgba(118,19,141,.08);
      font-family: Inter, system-ui, sans-serif; overflow: hidden;
      transform-origin: bottom right;
      transition: opacity .28s cubic-bezier(.22,1,.36,1),
                  transform .28s cubic-bezier(.22,1,.36,1);
      opacity: 0; transform: translateY(14px) scale(.97); pointer-events: none;
    }
    #omni-blocked-panel.omni-blocked--open {
      opacity: 1; transform: none; pointer-events: all;
    }
    #omni-blocked-header {
      background: linear-gradient(135deg, #76138D 0%, #BB35BE 100%);
      padding: 13px 16px; display: flex; align-items: center; gap: 10px;
      position: relative; overflow: hidden;
    }
    #omni-blocked-header::before {
      content: ''; position: absolute; inset: 0;
      background-image: radial-gradient(rgba(255,255,255,.12) 1px, transparent 1px);
      background-size: 18px 18px; pointer-events: none;
    }
    .omni-bh-avatar {
      position: relative; z-index: 1; flex-shrink: 0;
      width: 32px; height: 32px; border-radius: 50%;
      background: #050509; border: 2px solid rgba(255,255,255,.35);
      display: flex; align-items: center; justify-content: center;
    }
    .omni-bh-title {
      position: relative; z-index: 1;
      font-weight: 700; font-size: 14px; color: #fff; letter-spacing: -.01em;
    }
    #omni-blocked-close {
      margin-left: auto; position: relative; z-index: 1;
      background: rgba(255,255,255,.15); border: none; color: #fff; cursor: pointer;
      width: 26px; height: 26px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 17px; line-height: 1; transition: background .15s;
    }
    #omni-blocked-close:hover { background: rgba(255,255,255,.3); }
    #omni-blocked-close:focus-visible { outline: 2px solid rgba(255,255,255,.6); outline-offset: 2px; }
    #omni-blocked-body {
      padding: 22px 18px 24px;
      display: flex; flex-direction: column; align-items: center; gap: 14px;
      text-align: center;
    }
    .omni-blocked-icon {
      width: 46px; height: 46px; border-radius: 50%;
      background: rgba(118,19,141,.15); border: 1px solid rgba(118,19,141,.3);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .omni-blocked-icon svg { width: 21px; height: 21px; fill: #BB35BE; }
    .omni-blocked-msg {
      margin: 0; font-size: 13px; line-height: 1.6; color: #B6A2B6;
    }
    #omni-blocked-settings-btn {
      width: 100%; background: linear-gradient(135deg, #76138D, #BB35BE);
      color: #fff; border: none; border-radius: 10px;
      padding: 10px 16px; font-size: 13px; font-weight: 600;
      font-family: Inter, system-ui, sans-serif;
      cursor: pointer; transition: filter .15s;
    }
    #omni-blocked-settings-btn:hover { filter: brightness(1.12); }
    #omni-blocked-settings-btn:focus-visible { outline: 2px solid #C050C0; outline-offset: 2px; }
    @media (max-width: 768px) {
      #omni-blocked-panel { right: 10px; bottom: 80px; width: calc(100vw - 20px); max-width: 288px; }
    }
    @media (max-width: 420px)  { #omni-bubble { bottom: 16px; right: 12px; } }
    @media (max-height: 500px) { #omni-blocked-panel { bottom: 70px; } #omni-bubble { bottom: 14px; } }
    @media (prefers-reduced-motion: reduce) {
      #omni-bubble::before { animation: none; }
      #omni-blocked-panel  { transition: none; }
    }
  `;
  document.head.appendChild(style);

  document.getElementById('omni-chat-root').innerHTML = `
    <div id="omni-blocked-panel" role="region" aria-label="Asistente Omni desactivado">
      <div id="omni-blocked-header">
        <div class="omni-bh-avatar">
          <img src="assets/img/Logo_pentagono-removebg-preview.webp" alt="Omnex" width="28" height="28" style="display:block;width:28px;height:28px;object-fit:contain;" />
        </div>
        <span class="omni-bh-title">Omni</span>
        <button id="omni-blocked-close" aria-label="Cerrar panel">×</button>
      </div>
      <div id="omni-blocked-body">
        <div class="omni-blocked-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
        </div>
        <p class="omni-blocked-msg">El asistente Omni está desactivado porque no has aceptado las cookies funcionales. Puedes activarlo desde la configuración de cookies.</p>
        <button id="omni-blocked-settings-btn">Configurar cookies</button>
      </div>
    </div>
    <button id="omni-bubble" aria-label="Abrir asistente Omni" aria-expanded="false">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
    </button>
  `;

  const bubble = document.getElementById('omni-bubble');
  const panel  = document.getElementById('omni-blocked-panel');

  bubble.addEventListener('click', () => {
    const opening = !panel.classList.contains('omni-blocked--open');
    panel.classList.toggle('omni-blocked--open', opening);
    bubble.setAttribute('aria-expanded', String(opening));
  });

  document.getElementById('omni-blocked-close').addEventListener('click', () => {
    panel.classList.remove('omni-blocked--open');
    bubble.setAttribute('aria-expanded', 'false');
    bubble.focus();
  });

  document.getElementById('omni-blocked-settings-btn').addEventListener('click', () => {
    panel.classList.remove('omni-blocked--open');
    bubble.setAttribute('aria-expanded', 'false');
    if (typeof window.omnexOpenCookieSettings === 'function') {
      window.omnexOpenCookieSettings();
    }
  });

  (function revealBubble() {
    function show() {
      bubble.classList.add('omni-bubble--in');
      setTimeout(() => {
        bubble.classList.remove('omni-bubble--in');
        bubble.classList.add('omni-bubble--ready');
      }, 650);
    }
    const loader = document.getElementById('pageLoader');
    if (!loader) { setTimeout(show, 300); return; }
    if (loader.classList.contains('loaded')) { setTimeout(show, 400); return; }
    const observer = new MutationObserver(() => {
      if (loader.classList.contains('loaded')) {
        observer.disconnect();
        setTimeout(show, 400);
      }
    });
    observer.observe(loader, { attributes: true, attributeFilter: ['class'] });
  })();
}

/* ── ARRANQUE ───────────────────────────────────────────────────────────────
   El script se carga con defer: el DOM está siempre listo cuando este código
   se ejecuta, por lo que no es necesario esperar DOMContentLoaded.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  function hasConsent() {
    const status = localStorage.getItem('omnex-consent');
    if (status === 'accepted') return true;
    if (status === 'custom') {
      try {
        return JSON.parse(localStorage.getItem('omnex-consent-prefs') || '{}').preferences === true;
      } catch (e) { return false; }
    }
    return false;
  }

  if (hasConsent()) {
    initOmniChat();
  } else {
    initBlockedChat();
    document.addEventListener('omnex:consent-accepted', function () {
      const root = document.getElementById('omni-chat-root');
      if (root) root.innerHTML = '';
      const blockedStyle = document.getElementById('omni-blocked-style');
      if (blockedStyle) blockedStyle.remove();
      initOmniChat();
    }, { once: true });
  }
})();
