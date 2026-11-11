(function () {
  if (window.__jevPanel) return;
  window.__jevPanel = true;

  // Same thresholds as server.js, shown on the employee dashboard.
  const LIMIT = { frustration: 2, confidence: 0.8, human: 0.8 };

  const THINKING = [
    "Reckoning…", "Rectifying…", "Cogitating…", "Percolating…", "Noodling…",
    "Marinating…", "Wrangling…", "Flibbertigibbeting…", "Reticulating…"
  ];

  // JEV's speech bubble
  const LINES = {
    idle: ["Hi, I'm JEV. Tell me what's going on."],
    calm: [
      "All clear. Suspiciously pleasant.",
      "No drama detected. I'm almost disappointed.",
      "Smooth. Like a freshly rebooted router.",
      "Vibes: immaculate. Carry on."
    ],
    issue: [
      "An issue? Bold of you to bring it to me. Go on, I'm listening.",
      "Ah, a plot twist. Tell me more, I'll pretend I'm not enjoying this.",
      "Noted. Filing under \"definitely a thing\". Keep going.",
      "Right, a problem. Deploying my serious face… still deploying…",
      "Mm. Classic. Walk me through it, slowly, like I'm a very smart toaster."
    ],
    spicy: [
      "I can feel the eyebrow from here. We're nearly at human territory.",
      "Okay, that sounded like a sigh. A sigh with paperwork.",
      "Getting warm. One more nudge and I'm calling in a person.",
      "Wow, okay. I'm starting to take this personally. Professionally, of course."
    ],
    escalate: ["Okay, well, let's throw you a bone and get a human on the line."],
    human: ["Say no more. Human on the line, coming right up."]
  };

  // Chat replies that replace the generic "This is a demo…" message
  const REPLIES = {
    spicy: [
      "I can hear the frustration, and fair enough. One more detail and I'll either fix it or get a person on the line.",
      "Understood, that's properly annoying. Tell me the single worst bit and I'll go straight at it."
    ],
    confused: [
      "Sorry, I wasn't clear. In one line: what are you trying to do, and what's stopping you?",
      "Fair question. Let me try again: tell me what you were doing when it went wrong and I'll take it from there."
    ],
    greeting: [
      "Hello! I'm JEV. Tell me what's going on and I'll see what I can untangle.",
      "Hi there. What can I help you with today? The more detail, the better."
    ],
    thanks: [
      "You're very welcome. Anything else I can untangle?",
      "Happy to help. Shout if anything else pops up."
    ],
    issue: [
      "An issue, noted. What's it doing, and what did you expect it to do?",
      "Right, let's sort it. Which part is misbehaving, and when did it start?",
      "Thanks for flagging it. Is there an error message or odd behaviour you can describe?"
    ],
    question: [
      "Good question. Give me a touch more context and I'll point you the right way.",
      "Let me look into that. Can you tell me a bit more about what you're trying to do?"
    ],
    generic: [
      "Got it: \"{q}\". Tell me a bit more and I'll take it from there.",
      "Thanks for that. Could you share what you expected to happen, and what actually did?",
      "Noted. Anything else I should know before I dig in?"
    ]
  };
  const DEMO_TIP = " (Demo tip: ask for a human, or sound properly fed up, and I'll get someone on the line.)";

  const lastPick = {};
  function pick(key, list) {
    let i;
    do { i = Math.floor(Math.random() * list.length); }
    while (list.length > 1 && i === lastPick[key]);
    lastPick[key] = i;
    return list[i];
  }
  const clamp = (n) => Math.max(0, Math.min(100, n));

  const CSS = `
  #jev-panel{position:fixed;top:16px;right:16px;width:290px;max-height:calc(100vh - 32px);overflow:auto;z-index:1000;background:#fff;color:#0b0b0b;border:2px solid #0b0b0b;box-shadow:6px 6px 0 #1f6b3a;font:13px/1.5 "JetBrains Mono",ui-monospace,Menlo,Consolas,monospace}
  #jev-panel *{box-sizing:border-box}
  .jev-head{display:flex;justify-content:space-between;align-items:center;flex:none;background:#0b0b0b;color:#fff;padding:4px 10px;font-weight:700;letter-spacing:.04em}
  #jev-min{font:inherit;background:transparent;color:#fff;border:1px solid #fff;padding:0 8px;cursor:pointer}
  #jev-min::before,#jev-min::after{content:""}
  #jev-min:hover{background:#1f6b3a}
  .jev-body{padding:12px}
  #jev-panel.min .jev-body{display:none}
  #jev-bubble{position:relative;border:2px solid #0b0b0b;padding:8px 10px;margin-bottom:14px;font-weight:700;background:#fff;min-height:44px}
  #jev-bubble::after{content:"";position:absolute;left:50%;bottom:-10px;width:14px;height:14px;background:#fff;border-right:2px solid #0b0b0b;border-bottom:2px solid #0b0b0b;transform:translateX(-50%) rotate(45deg)}
  .jev-name{display:none;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#1f6b3a}
  .jev-dots{display:none;gap:4px;margin-left:6px;vertical-align:middle}
  .jev-dots i{display:block;width:6px;height:6px;background:#1f6b3a;animation:jev-dot 1s infinite ease-in-out}
  .jev-dots i:nth-child(2){animation-delay:.15s}
  .jev-dots i:nth-child(3){animation-delay:.3s}
  @keyframes jev-dot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-4px);opacity:1}}
  #jev-panel.typing .jev-dots,#jev-panel.thinking .jev-dots{display:inline-flex}
  #jev-panel.typing #jev-line{display:none}
  #jev-panel.thinking #jev-line::before{content:"✻ ";display:inline-block;color:#1f6b3a;animation:jev-spin 1.2s linear infinite}
  @keyframes jev-spin{to{transform:rotate(360deg)}}
  #jev-figure{margin:0 0 10px;text-align:center}
  #jev-art svg,#jev-art img{display:block;width:150px;height:auto;margin:0 auto;transform:rotate(-3deg);
    filter:drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(4px 6px 0 rgba(11,11,11,.35))}
  #jev-art img{width:170px;height:210px;object-fit:cover;object-position:center top}
  #jev-figure figcaption{margin-top:6px;font-size:11px;color:#55655a}
  #jev-verdict{text-align:center;font-weight:700;padding:6px;margin-bottom:12px;border:2px solid #0b0b0b}
  #jev-verdict.idle{border-style:dashed;color:#55655a}
  #jev-verdict.keep{background:#1f6b3a;color:#fff}
  #jev-verdict.connect{background:#0b0b0b;color:#fff}
  #jev-last{margin:-6px 0 12px;overflow-wrap:anywhere}
  .jev-row{margin-bottom:12px}
  .jev-label{display:flex;justify-content:space-between;font-weight:700}
  .jev-row.hit .jev-label b::after{content:" · TRIGGERED";color:#1f6b3a}
  .jev-bar{position:relative;height:14px;border:2px solid #0b0b0b;margin-top:6px}
  .band3{background:linear-gradient(90deg,#e6f2e9 0 33.34%,#b9d6c1 33.34% 66.67%,#0b0b0b 66.67% 100%)}
  .band2{background:linear-gradient(90deg,#e6f2e9 0 80%,#0b0b0b 80% 100%)}
  .jev-bar i{position:absolute;top:-5px;bottom:-5px;width:6px;margin-left:-3px;background:#1f6b3a;box-shadow:0 0 0 2px #fff,0 0 0 4px #0b0b0b;display:none;transition:left .4s ease}
  .jev-hint{font-size:11px;color:#55655a;margin-top:4px}
  #jev-panel.thinking #jev-art svg,#jev-panel.thinking #jev-art img{animation:jev-wobble .45s ease-in-out infinite alternate}
  @keyframes jev-wobble{from{transform:rotate(-5deg)}to{transform:rotate(2deg)}}
  @media (prefers-reduced-motion:reduce){#jev-panel *{animation:none!important;transition:none!important}}
  @media (max-width:1100px){#jev-panel:not(.slot):not(.bar){top:auto;bottom:8px;left:8px;right:8px;width:auto;max-height:50vh}}

  /* Employee dashboard: the card fills the space left in the sidebar, so nothing scrolls or gets cut off */
/* Employee dashboard: the card fills the space left in the sidebar, so nothing scrolls or gets cut off */
  #jev-panel.slot{position:static;width:auto;max-height:none;flex:1;min-height:0;overflow:hidden;display:flex;flex-direction:column;margin:0 4px 4px 0;box-shadow:4px 4px 0 #1f6b3a}
  #jev-panel.slot.min{flex:none}
  #jev-panel.slot .jev-body{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;padding:8px 10px}
  #jev-panel.slot.min .jev-body{display:none}
  #jev-panel.slot #jev-bubble{flex:none;margin-bottom:12px;padding:6px 8px;min-height:0;font-size:12px}
  #jev-panel.slot #jev-figure{flex:1;min-height:0;display:flex;flex-direction:column;margin:0 0 8px}
  #jev-panel.slot #jev-art{position:relative;flex:1;min-height:70px}
  #jev-panel.slot #jev-art img{position:absolute;top:0;left:50%;display:block;height:100%;width:auto;max-width:100%;aspect-ratio:228/304;margin:0;transform:translateX(-50%) rotate(-3deg)}
  #jev-panel.slot #jev-art svg{position:absolute;top:0;left:50%;display:block;height:100%;width:auto;max-width:100%;aspect-ratio:200/260;margin:0;transform:translateX(-50%) rotate(-3deg)}
  #jev-panel.slot #jev-figure figcaption{flex:none;margin-top:4px;font-size:10px}
  #jev-panel.slot #jev-verdict{flex:none;padding:4px;margin-bottom:8px;font-size:12px}
  #jev-panel.slot #jev-last{flex:none;margin:0 0 8px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
  #jev-panel.slot .jev-row{flex:none;margin-bottom:8px}
  #jev-panel.slot .jev-row:last-child{margin-bottom:0}
  #jev-panel.slot .jev-bar{height:12px;margin-top:5px}
  #jev-panel.slot .jev-hint{font-size:10px;margin-top:2px}
  @media (max-height:860px){#jev-panel.slot .jev-hint{display:none}}

  /* Customer chat: JEV is a bar inside the chat card, centred with it, so resizing never strands it */
  #jev-panel.bar{position:static;width:auto;max-height:none;overflow:visible;flex:none;border:0;border-bottom:2px solid #0b0b0b;box-shadow:none;background:#fff}
  #jev-panel.bar .jev-head{display:none}
  #jev-panel.bar .jev-body{display:flex;align-items:center;gap:18px;padding:12px 16px}
  #jev-panel.bar #jev-figure{order:0;flex:none;margin:0}
  #jev-panel.bar #jev-figure figcaption{display:none}
  #jev-panel.bar #jev-art img{width:60px;height:76px;margin:0}
  #jev-panel.bar #jev-art svg{width:60px;height:auto;margin:0}
  #jev-panel.bar #jev-bubble{order:1;flex:1;min-width:0;min-height:0;margin:0;padding:8px 12px;font-size:12.5px}
  #jev-panel.bar .jev-name{display:block}
  #jev-panel.bar #jev-bubble::after{left:-9px;bottom:auto;top:50%;border-right:0;border-top:0;border-left:2px solid #0b0b0b;border-bottom:2px solid #0b0b0b;transform:translateY(-50%) rotate(45deg)}
  `;

  const CARTOON = `
  <svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="JEV, cartoon cardboard cutout">
    <path d="M20 260C20 205 55 190 100 190C145 190 180 205 180 260Z" fill="#1f6b3a" stroke="#0b0b0b" stroke-width="4"/>
    <rect x="84" y="160" width="32" height="34" fill="#fff" stroke="#0b0b0b" stroke-width="4"/>
    <path d="M55 70C55 35 145 35 145 70L145 130C145 160 125 175 100 175C75 175 55 160 55 130Z" fill="#fff" stroke="#0b0b0b" stroke-width="4"/>
    <path d="M52 78C46 28 154 22 148 78C135 56 65 56 52 78Z" fill="#0b0b0b"/>
    <path d="M70 90L92 85M108 85L130 90" stroke="#0b0b0b" stroke-width="5" stroke-linecap="round"/>
    <circle cx="82" cy="104" r="5" fill="#0b0b0b"/><circle cx="118" cy="104" r="5" fill="#0b0b0b"/>
    <path d="M70 130Q100 164 130 130Z" fill="#fff" stroke="#0b0b0b" stroke-width="4" stroke-linejoin="round"/>
    <path d="M96 164Q100 168 104 164" stroke="#0b0b0b" stroke-width="3" fill="none" stroke-linecap="round"/>
    <text x="100" y="238" text-anchor="middle" font-family="monospace" font-weight="700" font-size="28" fill="#fff">JEV</text>
  </svg>`;

  // Confidence meters: only built on the employee dashboard.
  const METERS = `
    <div id="jev-verdict" class="idle">WAITING FOR A CUSTOMER MESSAGE</div>
    <div id="jev-last" class="jev-hint"></div>

    <div class="jev-row" id="jev-r1">
      <div class="jev-label"><span>Frustration</span><b id="jev-v1">n/a</b></div>
      <div class="jev-bar band3"><i id="jev-m1"></i></div>
      <div class="jev-hint">calm · spicy · human. Connects at 2 or more (scale 0 to 3).</div>
    </div>
    <div class="jev-row" id="jev-r2">
      <div class="jev-label"><span>Sentiment</span><b id="jev-v2">n/a</b></div>
      <div class="jev-bar band2"><i id="jev-m2"></i></div>
      <div class="jev-hint">Connects if frustrated or angry and over 80% sure.</div>
    </div>
    <div class="jev-row" id="jev-r3">
      <div class="jev-label"><span>Asked for a human</span><b id="jev-v3">n/a</b></div>
      <div class="jev-bar band2"><i id="jev-m3"></i></div>
      <div class="jev-hint">Connects if over 80% likely.</div>
    </div>`;

  function buildHTML(isEmployee) {
    return `
    <div class="jev-head"><span>JEV // AI AGENT</span><button id="jev-min" aria-label="Minimise JEV panel">–</button></div>
    <div class="jev-body">
      <div id="jev-bubble" aria-live="polite"><span class="jev-name">JEV · support agent</span><span id="jev-line">${LINES.idle[0]}</span><span class="jev-dots" aria-hidden="true"><i></i><i></i><i></i></span></div>
      <figure id="jev-figure"><div id="jev-art">${CARTOON}</div><figcaption>JEV · support agent</figcaption></figure>
      ${isEmployee ? METERS : ""}
    </div>`;
  }

  let panel = null;
  let employee = false;
  let lastEval = null;
  let evalPending = false;
  let turns = 0;
  let typingTimer = null;
  const $ = (id) => document.getElementById(id);
  const realFetch = window.fetch.bind(window);

  function init() {
    const font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap';
    document.head.appendChild(font);

    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    // Dashboard: a #jev-slot exists, so show the full panel with meters there.
    // Customer chat: put JEV as a bar inside the chat card, between the header and the messages.
    const slot = document.getElementById('jev-slot');
    const chat = document.querySelector('.chat-container');
    const chatWin = document.getElementById('chat-window');
    employee = !!slot;

    panel = document.createElement('aside');
    panel.id = 'jev-panel';
    panel.innerHTML = buildHTML(employee);

    if (employee) {
      panel.classList.add('slot');
      slot.appendChild(panel);
    } else if (chat && chatWin && chatWin.parentNode === chat) {
      panel.classList.add('bar');
      chat.insertBefore(panel, chatWin);
    } else {
      document.body.appendChild(panel);
    }

    $('jev-min').addEventListener('click', () => panel.classList.toggle('min'));

    // If public/jev.png exists it replaces the cartoon.
    const probe = new Image();
    probe.alt = 'JEV';
    probe.onload = () => $('jev-art').replaceChildren(probe);
    probe.src = 'jev.png';

    if (employee) {
      poll();
      setInterval(poll, 1500);
    } else {
      watchChat();
      watchTyping();
    }
  }

  function say(text) { $('jev-line').textContent = text; }

  function setVerdict(kind, text) {
    const v = $('jev-verdict');
    if (!v) return;
    v.className = kind;
    v.textContent = text;
  }

  function setRow(n, pct, text, hit) {
    const m = $('jev-m' + n);
    if (pct === null) {
      m.style.display = 'none';
    } else {
      m.style.display = 'block';
      m.style.left = clamp(pct) + '%';
    }
    $('jev-v' + n).textContent = text;
    $('jev-r' + n).classList.toggle('hit', !!hit);
  }

  function thinking(on) {
    if (!panel) return;
    panel.classList.toggle('thinking', on);
    if (on) {
      panel.classList.remove('typing');
      say(pick('thinking', THINKING));
    }
  }

  function fail() {
    if (!panel) return;
    say("Hmm, I lost the plot. Carry on, I'll catch up.");
  }

  function show(data) {
    if (!panel || !data || !data.action) return;
    lastEval = data;
    const s = data.scores || {};
    const num = (v) => (v !== undefined && v !== null && isFinite(v) ? Number(v) : null);
    const frus = num(s.frustrationScore);
    const conf = num(s.sentimentConfidence);
    const human = num(s.wantsHumanProbability);
    const sent = s.sentiment ? String(s.sentiment) : null;
    const negative = sent === 'frustrated' || sent === 'angry';
    const connect = data.action === 'offer_escalation';
    const humanAsked = human !== null && human > LIMIT.human;

    // Confidence scores are for employees only.
    if (employee) {
      setRow(1, frus === null ? null : (frus / 3) * 100,
        frus === null ? 'n/a' : frus.toFixed(1) + ' / 3',
        frus !== null && frus >= LIMIT.frustration);

      setRow(2, conf === null ? null : conf * 100,
        sent && conf !== null ? sent + ' ' + Math.round(conf * 100) + '%' : 'n/a',
        negative && conf !== null && conf > LIMIT.confidence);

      setRow(3, human === null ? null : human * 100,
        human === null ? 'n/a' : Math.round(human * 100) + '%',
        humanAsked);

      setVerdict(connect ? 'connect' : 'keep', connect ? 'HUMAN NEEDED: CONNECT' : 'BOT IS HANDLING IT');
      $('jev-last').textContent = data.lastMessage ? 'Customer said: "' + data.lastMessage + '"' : '';
    }

    let line;
    if (connect) line = pick('esc', humanAsked ? LINES.human : LINES.escalate);
    else if (frus !== null && frus >= 1.5) line = pick('spicy', LINES.spicy);
    else if (frus !== null && frus >= 0.5) line = pick('issue', LINES.issue);
    else line = pick('calm', LINES.calm);
    say(line);
  }

  // ---------- Customer page: dots while the user types ----------

  function watchTyping() {
    const input = $('chat-input');
    if (!input) return;
    input.addEventListener('input', () => {
      if (!input.value || panel.classList.contains('thinking')) return;
      panel.classList.add('typing');
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => panel.classList.remove('typing'), 1500);
    });
  }

  // ---------- Customer page: adaptive chat replies ----------

  function adaptReply(userText, ev) {
    const t = (userText || '').toLowerCase();
    const s = (ev && ev.scores) || {};
    const f = isFinite(s.frustrationScore) ? Number(s.frustrationScore) : 0;
    const sent = s.sentiment || '';
    const snippet = (userText || 'that').slice(0, 60);
    turns += 1;

    let pool;
    if (f >= 1.5) pool = 'spicy';
    else if (sent === 'confused' || /what do you mean|don't understand|dont understand|confus|makes no sense/.test(t)) pool = 'confused';
    else if (/\b(hi|hello|hey|hola|bonjour|good (morning|afternoon|evening))\b/.test(t)) pool = 'greeting';
    else if (/\b(thanks|thank you|cheers|merci|gracias)\b/.test(t)) pool = 'thanks';
    else if (/\b(issue|problem|broken|not working|doesn't work|doesnt work|error|bug|stuck|can't|cant|cannot|won't|wont)\b/.test(t)) pool = 'issue';
    else if (/\?\s*$/.test(t) || /^(what|how|why|where|when|who|can|could|do|does|is|are)\b/.test(t)) pool = 'question';
    else pool = 'generic';

    let reply = pick('chat-' + pool, REPLIES[pool]).replace('{q}', snippet);
    if (turns % 3 === 0) reply += DEMO_TIP;
    return reply;
  }

  function whenEvalReady(cb) {
    let waited = 0;
    (function check() {
      if (!evalPending || waited >= 2000) return cb();
      waited += 100;
      setTimeout(check, 100);
    })();
  }

  function removeStaleTyping() {
    document.querySelectorAll('#chat-window .message').forEach((n) => {
      if ((n.textContent || '').trim().replace(/…/g, '...') === 'Typing...') n.remove();
    });
  }

  function maybeRewrite(el, text) {
    if (!el || el.dataset.jev) return;
    if (text.indexOf('This is a demo.') === -1 || text.indexOf('sound frustrated') === -1) return;
    el.dataset.jev = '1';
    el.style.visibility = 'hidden';
    const m = text.match(/This is a demo\.\s*"([\s\S]*?)"\s*would be handled/);
    const userText = m ? m[1] : '';
    whenEvalReady(() => {
      el.textContent = adaptReply(userText, lastEval);
      el.style.visibility = '';
      const win = $('chat-window');
      if (win) win.scrollTop = win.scrollHeight;
    });
  }

  function handleMessage(el) {
    const text = (el.textContent || '').trim();
    if (!text || /^typing/i.test(text)) return;
    // A real reply has arrived, so clear any leftover "Typing..." bubbles.
    if (el.classList.contains('bot')) removeStaleTyping();
    maybeRewrite(el, text);
  }

  function watchChat() {
    const win = $('chat-window');
    if (!win) return;
    new MutationObserver((muts) => {
      const seen = new Set();
      muts.forEach((mu) => {
        const nodes = mu.type === 'characterData' ? [mu.target] : Array.from(mu.addedNodes);
        nodes.forEach((n) => {
          const base = n.nodeType === 3 ? n.parentElement : n;
          if (!base || !base.closest) return;
          const list = [];
          const own = base.closest('.message');
          if (own) list.push(own);
          else if (base.querySelectorAll) base.querySelectorAll('.message').forEach((x) => list.push(x));
          list.forEach((el) => {
            if (!seen.has(el)) { seen.add(el); handleMessage(el); }
          });
        });
      });
    }).observe(win, { childList: true, subtree: true, characterData: true });
  }

  // ---------- Employee dashboard: poll the server for the latest evaluation ----------

  let lastAt = 0;
  function poll() {
    realFetch('/api/jev/latest')
      .then((r) => r.json())
      .then((d) => {
        if (d && d.at && d.at !== lastAt) {
          lastAt = d.at;
          show(d);
        }
      })
      .catch(() => {});
  }

  // ---------- Customer chat: listen to the existing /api/evaluate call without changing customer.js ----------

  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    const watching = url.indexOf('/api/evaluate') !== -1;
    if (watching) {
      evalPending = true;
      lastEval = null;
      thinking(true);
    }
    const p = realFetch(input, init);
    if (watching) {
      p.then((r) => r.clone().json())
        .then(show)
        .catch(fail)
        .finally(() => { evalPending = false; thinking(false); });
    }
    return p;
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();