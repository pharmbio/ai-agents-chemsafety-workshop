/* ==========================================================================
   AI agents for chemical safety | interactive behaviour
   Settings come from hugo.toml and /data via the #site-config JSON block.
   You normally do not need to edit this file.
   ========================================================================== */

const cfg = JSON.parse(document.getElementById('site-config').textContent);
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const DAY = 86400000;

/* ---------- Small helpers ---------- */

// Safe browser storage (private mode or blocked storage must not break the page)
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('aics:' + key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem('aics:' + key, JSON.stringify(value)); } catch { /* ignore */ } },
  remove(key) { try { localStorage.removeItem('aics:' + key); } catch { /* ignore */ } },
};

// Add ?now=2026-11-03T11:15 to the URL to preview the page as it looks at that moment.
const nowOverride = (() => {
  const q = new URLSearchParams(location.search).get('now');
  if (!q) return null;
  const withOffset = /[zZ]|[+-]\d\d:\d\d$/.test(q) ? q : q + (q.length <= 16 ? ':00' : '') + cfg.utcOffset;
  const d = new Date(withOffset);
  return isNaN(d) ? null : d;
})();
const now = () => nowOverride || new Date();

const at = (hhmm) => new Date(`${cfg.date}T${hhmm}:00${cfg.utcOffset}`);
const eventStart = at(cfg.startTime);
const eventEnd = at(cfg.endTime);
const sessions = (cfg.programme.sessions || []).map((s) => ({ ...s, startDate: at(s.start), endDate: at(s.end) }));
const localTz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return cfg.timezone; } })();
const sameTz = (() => {
  // Same offset as the event on the event day counts as the same zone
  try {
    const f = (tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(eventStart);
    return f(localTz) === f(cfg.timezone);
  } catch { return true; }
})();

function fmtTime(date, tz) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(date);
}
function tzShortName(date, tz) {
  try {
    const part = new Intl.DateTimeFormat('en-GB', { timeZone: tz, timeZoneName: 'short' }).formatToParts(date).find((p) => p.type === 'timeZoneName');
    return part ? part.value : tz;
  } catch { return tz; }
}
function fmtDate(d) {
  return new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: cfg.timezone }).format(d);
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function currentSession(t = now()) {
  return sessions.find((s) => t >= s.startDate && t < s.endDate);
}

/* ---------- Navigation (mobile menu) ---------- */

function initNav() {
  const btn = $('.nav-toggle');
  const nav = $('#site-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Close' : 'Menu';
  });
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a') && nav.classList.contains('open')) btn.click();
  });
}

/* ---------- Status line in the top banner ---------- */

function deadlineDate() {
  const d = cfg.registration.deadline;
  return d ? new Date(`${d}T23:59:59${cfg.utcOffset}`) : null;
}
function registrationClosed() {
  const d = deadlineDate();
  return !cfg.registration.open || (d && now() > d) || now() > eventEnd;
}
function deadlineText() {
  const d = deadlineDate();
  if (!d) return cfg.registration.deadlineLabel || '';
  if (now() > d) return 'Registration is closed';
  return `Register by ${fmtDate(d)}`;
}

function updateStatus() {
  const el = $('[data-status]');
  $$('[data-deadline]').forEach((n) => { n.textContent = deadlineText(); });
  if (!el) return;
  const t = now();
  if (t < eventStart) {
    const days = Math.ceil((eventStart - t) / DAY);
    const sameDay = eventStart - t < DAY && new Date(t).toDateString() === eventStart.toDateString();
    const when = sameDay ? `Starts today at ${cfg.startTime} ${cfg.timezoneLabel}` : days === 1 ? 'Starts tomorrow' : `${days} days to go`;
    el.innerHTML = `<strong>${when}.</strong> ${esc(deadlineText())}.`;
  } else if (t < eventEnd) {
    const s = currentSession(t);
    el.innerHTML = s ? `<strong>Happening now:</strong> <a href="#programme">${esc(s.title)}</a>` : '<strong>The workshop is on today.</strong>';
  } else {
    el.innerHTML = `The workshop took place on ${esc(fmtDate(eventStart))}. Slides and recordings are added to the programme when available.`;
  }
}

/* ---------- Agent trace animation (runs once, when visible) ---------- */

function initTrace() {
  const trace = $('.trace');
  if (!trace) return;
  const replay = $('[data-trace-replay]', trace);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;
  const steps = $$('.step', trace).length;
  const play = () => {
    trace.classList.remove('play');
    void trace.offsetWidth; // restart CSS animation
    trace.classList.add('play');
    if (replay) {
      replay.hidden = true;
      setTimeout(() => { replay.hidden = false; }, steps * 750 + 700);
    }
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { play(); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(trace);
  } else play();
  if (replay) replay.addEventListener('click', play);
}

/* ---------- Calendar files (.ics) ---------- */

function icsDate(d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
function icsText(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;'); }
function fold(line) {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
}
function buildIcs(events) {
  const v = cfg.venue;
  const location = `${v.name}, ${v.entrance}, ${v.room}, ${v.address}`;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AI agents for chemical safety//Workshop site//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
  const stamp = icsDate(new Date());
  events.forEach((ev) => {
    lines.push('BEGIN:VEVENT',
      `UID:${ev.uid}@ai-agents-chemsafety`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(ev.start)}`,
      `DTEND:${icsDate(ev.end)}`,
      `SUMMARY:${icsText(ev.title)}`,
      `LOCATION:${icsText(location)}`,
      `DESCRIPTION:${icsText(ev.description)}`,
      `URL:${cfg.url}`,
      'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n');
}
function download(filename, text) {
  const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function initIcs() {
  const onlineNote = cfg.venue.onlineNote || '';
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-ics]');
    if (!btn) return;
    const kind = btn.dataset.ics;
    if (kind === 'event') {
      download('ai-agents-chemical-safety.ics', buildIcs([{
        uid: 'workshop-' + cfg.date,
        start: eventStart, end: eventEnd, title: cfg.title,
        description: `Workshop programme and details: ${cfg.url}\n\n${onlineNote}`,
      }]));
    } else if (kind === 'starred') {
      const starred = store.get('starred', []);
      const picked = sessions.filter((s) => starred.includes(s.id));
      if (!picked.length) { flashMessage(btn, 'Star at least one session first.'); return; }
      download('my-sessions-ai-agents-chemical-safety.ics', buildIcs(picked.map((s) => ({
        uid: `${s.id}-${cfg.date}`, start: s.startDate, end: s.endDate,
        title: `${s.title} | ${cfg.title}`, description: `${s.description || ''}\n\n${cfg.url}`,
      }))));
    }
  });
}
function flashMessage(anchor, text) {
  let tip = anchor.nextElementSibling;
  if (!tip || !tip.classList.contains('inline-tip')) {
    tip = document.createElement('span');
    tip.className = 'inline-tip muted small';
    tip.setAttribute('role', 'status');
    anchor.after(tip);
  }
  tip.textContent = ' ' + text;
  setTimeout(() => { tip.textContent = ''; }, 3500);
}

/* ---------- Share ---------- */

function initShare() {
  $$('[data-share]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const data = { title: cfg.title, text: `${cfg.title}, ${fmtDate(eventStart)}`, url: cfg.url };
      try {
        if (navigator.share) { await navigator.share(data); return; }
        await navigator.clipboard.writeText(cfg.url);
        const old = btn.textContent;
        btn.textContent = 'Link copied';
        setTimeout(() => { btn.textContent = old; }, 2000);
      } catch { /* user cancelled */ }
    });
  });
}

/* ---------- Programme: time zones, filters, starred sessions, now ---------- */

function initProgramme() {
  const root = $('#programme');
  if (!root) return;
  $$('[data-needs-js]').forEach((n) => { n.hidden = false; });
  const items = $$('.session', root);
  const empty = $('[data-empty]', root);
  let tzMode = store.get('tz', 'event');
  let starred = store.get('starred', []);
  const hiddenTypes = new Set(store.get('hiddenTypes', []));
  const myOnly = $('[data-my-only]', root);
  if (myOnly) myOnly.checked = store.get('myOnly', false) && starred.length > 0;

  const localBtn = $('[data-tz="local"]', root);
  if (localBtn) {
    localBtn.textContent = sameTz ? 'Your time zone (same as Uppsala)' : `Your time zone (${tzShortName(eventStart, localTz)})`;
  }

  function renderTimes() {
    const tz = tzMode === 'local' ? localTz : cfg.timezone;
    items.forEach((li) => {
      const s = sessions.find((x) => x.id === li.dataset.id);
      if (!s) return;
      $('.t-start', li).textContent = fmtTime(s.startDate, tz);
      const endT = $('.t-end time', li);
      if (endT) endT.textContent = fmtTime(s.endDate, tz);
    });
    $$('[data-tz]', root).forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tz === tzMode)));
  }

  function renderVisibility() {
    let shown = 0;
    items.forEach((li) => {
      const typeHidden = hiddenTypes.has(li.dataset.type);
      const starHidden = myOnly && myOnly.checked && !starred.includes(li.dataset.id);
      li.hidden = typeHidden || starHidden;
      if (!li.hidden) shown++;
    });
    $$('[data-filter]', root).forEach((b) => b.setAttribute('aria-pressed', String(!hiddenTypes.has(b.dataset.filter))));
    if (empty) empty.hidden = shown > 0;
  }

  function renderStars() {
    $$('[data-star]', root).forEach((b) => b.setAttribute('aria-pressed', String(starred.includes(b.dataset.star))));
  }

  function renderNow() {
    const t = now();
    items.forEach((li) => {
      const s = sessions.find((x) => x.id === li.dataset.id);
      if (!s) return;
      const isNow = t >= s.startDate && t < s.endDate;
      li.classList.toggle('is-now', isNow);
      li.classList.toggle('is-past', t >= s.endDate && t < new Date(eventEnd.getTime() + DAY / 2));
      $('.now-badge', li).hidden = !isNow;
    });
  }

  root.addEventListener('click', (e) => {
    const tzBtn = e.target.closest('[data-tz]');
    if (tzBtn) { tzMode = tzBtn.dataset.tz; store.set('tz', tzMode); renderTimes(); return; }
    const f = e.target.closest('[data-filter]');
    if (f) {
      const k = f.dataset.filter;
      hiddenTypes.has(k) ? hiddenTypes.delete(k) : hiddenTypes.add(k);
      store.set('hiddenTypes', [...hiddenTypes]);
      renderVisibility();
      return;
    }
    const star = e.target.closest('[data-star]');
    if (star) {
      const id = star.dataset.star;
      starred = starred.includes(id) ? starred.filter((x) => x !== id) : [...starred, id];
      store.set('starred', starred);
      star.classList.remove('pop'); void star.offsetWidth; star.classList.add('pop');
      renderStars();
      renderVisibility();
    }
  });
  if (myOnly) myOnly.addEventListener('change', () => { store.set('myOnly', myOnly.checked); renderVisibility(); });

  // Jump from a speaker card to a session
  document.addEventListener('click', (e) => {
    const g = e.target.closest('[data-goto]');
    if (!g) return;
    e.preventDefault();
    const li = $(`.session[data-id="${CSS.escape(g.dataset.goto)}"]`);
    if (!li) return;
    li.hidden = false;
    li.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    const det = $('details', li); if (det) det.open = true;
    li.classList.remove('flash'); void li.offsetWidth; li.classList.add('flash');
  });

  renderTimes(); renderStars(); renderVisibility(); renderNow();
  setInterval(() => { renderNow(); updateStatus(); }, 30000);
}

/* ---------- Topics of interest (About section) ---------- */

function initTopics() {
  let picked = store.get('topics', []);
  const count = $('[data-topics-count]');
  function render() {
    $$('[data-topic]').forEach((b) => b.setAttribute('aria-pressed', String(picked.includes(b.dataset.topic))));
    $$('[data-topic-input]').forEach((i) => { i.checked = picked.includes(i.dataset.topicInput); });
    if (count) {
      count.innerHTML = picked.length
        ? `${picked.length} selected. They are filled in on the <a href="#register">registration form</a>.`
        : '';
    }
  }
  function toggle(id, on) {
    const has = picked.includes(id);
    if (on === undefined) on = !has;
    picked = on ? (has ? picked : [...picked, id]) : picked.filter((x) => x !== id);
    store.set('topics', picked);
    render();
  }
  $$('[data-topic]').forEach((b) => b.addEventListener('click', () => toggle(b.dataset.topic)));
  $$('[data-topic-input]').forEach((i) => i.addEventListener('change', () => toggle(i.dataset.topicInput, i.checked)));
  render();
}

/* ---------- Sending data to the chosen backend ---------- */

function formData(form) {
  const out = {};
  new FormData(form).forEach((value, key) => {
    if (key === 'form-name') return;
    if (key in out) out[key] = [].concat(out[key], value);
    else out[key] = value;
  });
  if (out.interests && !Array.isArray(out.interests)) out.interests = [out.interests];
  return out;
}

function mailtoBody(type, data) {
  const labels = { registration: 'Registration', question: 'Question for the panel', vote: 'Discussion vote' };
  const lines = [`${labels[type] || type} for "${cfg.title}" (${cfg.date})`, ''];
  Object.entries(data).forEach(([k, v]) => {
    if (k === 'website' || v === '' || v == null) return;
    lines.push(`${k}: ${Array.isArray(v) ? v.join(', ') : v}`);
  });
  return lines.join('\n');
}

async function send(type, data) {
  const r = cfg.registration;
  const provider = (r.provider || 'mailto').toLowerCase();
  if (data.website) return { ok: true, spam: true }; // honeypot filled: pretend success
  const payload = { type, ...data, submittedAt: new Date().toISOString(), page: location.href };
  delete payload.website;

  if (provider === 'apps-script' || provider === 'formspree') {
    if (!r.endpoint) throw new Error('not-connected');
    const opts = provider === 'formspree'
      ? { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) }
      : { method: 'POST', body: JSON.stringify(payload) }; // text/plain: no CORS preflight for Apps Script
    const res = await fetch(r.endpoint, opts);
    let json = {};
    try { json = await res.json(); } catch { json = { ok: res.ok }; }
    if (provider === 'formspree') json.ok = res.ok && !json.errors;
    if (!json.ok) throw new Error(json.error || 'failed');
    return json;
  }

  if (provider === 'netlify') {
    const names = { registration: 'registration', question: 'question', vote: 'poll' };
    const body = new URLSearchParams();
    body.append('form-name', names[type]);
    Object.entries(data).forEach(([k, v]) => body.append(k, Array.isArray(v) ? v.join(', ') : v));
    const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() });
    if (!res.ok) throw new Error('failed');
    return { ok: true };
  }

  // Default: mailto
  const subjects = { registration: `Registration: ${cfg.title}`, question: `Question for the panel: ${cfg.title}`, vote: `Discussion vote: ${cfg.title}` };
  const href = `mailto:${cfg.contact.email}?subject=${encodeURIComponent(subjects[type])}&body=${encodeURIComponent(mailtoBody(type, data))}`;
  window.location.href = href;
  return { ok: true, mailto: true };
}

function errorText(err) {
  if (err && err.message === 'not-connected') return `Online registration is not connected yet. Email ${cfg.contact.email} to register.`;
  if (err && err.message === 'duplicate') return 'This email address is already registered. Contact the organisers to change your registration.';
  if (err && err.message === 'onsite-full') return 'On-site places are full. Choose online attendance, or contact the organisers to join the waiting list.';
  return `Sending failed. Check your connection and try again, or email ${cfg.contact.email}.`;
}

/* ---------- Form validation ---------- */

function validate(form) {
  let first = null;
  const mark = (field, bad) => {
    const box = field.closest('.field') || field.closest('.check') || field.parentElement;
    box.classList.toggle('invalid', bad);
    if (bad && !first) first = field;
  };
  $$('[required]', form).forEach((el) => {
    if (el.type === 'radio') {
      const group = $$(`[name="${el.name}"]`, form);
      if (group[0] !== el) return;
      mark(el, !group.some((r) => r.checked));
    } else if (el.type === 'checkbox') {
      mark(el, !el.checked);
    } else if (el.type === 'email') {
      mark(el, !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
    } else {
      mark(el, !el.value.trim());
    }
  });
  if (first) first.focus();
  return !first;
}
function liveRevalidate(form) {
  form.addEventListener('input', (e) => {
    const box = e.target.closest('.invalid');
    if (box) box.classList.remove('invalid');
  });
  form.addEventListener('change', (e) => {
    const box = e.target.closest('.invalid');
    if (box) box.classList.remove('invalid');
  });
}
function setStatus(form, text, kind) {
  const st = $('.form-status', form);
  if (!st) return;
  st.textContent = text;
  st.className = 'form-status' + (kind ? ' is-' + kind : '');
}

/* ---------- Registration ---------- */

function initRegistration() {
  const form = $('#registration-form');
  if (!form) return;
  const panel = form.parentElement;
  const onsite = $('[data-onsite]', form);
  const success = $('[data-success]', panel);
  const already = $('[data-already]', panel);

  if (registrationClosed()) {
    panel.innerHTML = `<div class="notice"><p>${esc(cfg.registration.closedMessage)}</p></div>`;
    return;
  }

  const saved = store.get('registration', null);
  if (saved && already) {
    already.hidden = false;
    $('[data-already-name]', already).textContent = saved.name ? `, ${saved.name}` : '';
  }
  const again = $('[data-register-again]', panel);
  if (again) again.addEventListener('click', () => { store.remove('registration'); already.hidden = true; form.hidden = false; form.reset(); $('input', form).focus(); });

  form.addEventListener('change', (e) => {
    if (e.target.name === 'attendance') onsite.hidden = e.target.value !== 'On site';
  });
  liveRevalidate(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(form)) { setStatus(form, 'Check the highlighted fields.', 'error'); return; }
    const data = formData(form);
    if (data.attendance !== 'On site') { delete data.lunch; delete data.diet; delete data.access; }
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    setStatus(form, 'Sending…');
    try {
      const res = await send('registration', data);
      form.hidden = true;
      if (already) already.hidden = true;
      success.hidden = false;
      const h = $('h3', success);
      const p = $('[data-success-text]', success);
      if (res.mailto) {
        h.textContent = 'One more step';
        p.innerHTML = `Your email app has opened with the registration details. <strong>Send that email to finish registering.</strong> If nothing opened, email your details to <a href="mailto:${esc(cfg.contact.email)}">${esc(cfg.contact.email)}</a>.`;
      } else {
        store.set('registration', { name: data.name, attendance: data.attendance, at: new Date().toISOString() });
        h.textContent = 'You are registered';
        p.textContent = data.attendance === 'Online'
          ? `Thank you, ${data.name}. The Zoom link will be emailed to ${data.email} the day before the workshop.`
          : `Thank you, ${data.name}. See you in ${cfg.venue.room}, ${cfg.venue.entrance}, on ${fmtDate(eventStart)}. Coffee is served from ${cfg.programme.sessions[0].start}.`;
      }
      success.focus();
    } catch (err) {
      setStatus(form, errorText(err), 'error');
    } finally {
      btn.disabled = false;
    }
  });
}

/* ---------- On-site capacity (Apps Script only) ---------- */

async function initCapacity() {
  const r = cfg.registration;
  const el = $('[data-capacity]');
  if (!el || r.provider !== 'apps-script' || !r.endpoint || !(r.onsiteCapacity > 0)) return;
  try {
    const res = await fetch(`${r.endpoint}?action=stats`);
    const j = await res.json();
    if (typeof j.onsite !== 'number') return;
    const left = Math.max(0, r.onsiteCapacity - j.onsite);
    el.hidden = false;
    if (left === 0) {
      el.textContent = 'On-site places are full. Online places are still available.';
      const radio = $('input[name="attendance"][value="On site"]');
      if (radio) { radio.disabled = true; radio.closest('.choice').title = 'On-site places are full'; }
    } else {
      el.textContent = `${left} of ${r.onsiteCapacity} on-site places left.`;
    }
  } catch { /* stats are optional */ }
}

/* ---------- Questions to the panel ---------- */

function initQuestions() {
  const form = $('#question-form');
  if (!form) return;
  liveRevalidate(form);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(form)) { setStatus(form, 'Write a question before sending.', 'error'); return; }
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    setStatus(form, 'Sending…');
    try {
      const res = await send('question', formData(form));
      form.reset();
      setStatus(form, res.mailto ? 'Your email app has opened. Send the email to deliver your question.' : 'Question sent. Thank you.', 'ok');
    } catch (err) {
      setStatus(form, errorText(err), 'error');
    } finally { btn.disabled = false; }
  });
}

/* ---------- Poll ---------- */

function initPoll() {
  const box = $('[data-poll]');
  if (!box) return;
  const form = $('[data-poll-form]', box);
  const r = cfg.registration;
  const liveResults = r.provider === 'apps-script' && r.endpoint;
  const myVote = store.get('vote', null);

  function lock(choice) {
    box.classList.add('voted');
    $$('input[name="vote"]', form).forEach((i) => { i.disabled = true; i.checked = i.value === choice; });
    $('button[type="submit"]', form).hidden = true;
  }
  function showResults(counts) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (!total) return;
    box.classList.add('has-results');
    (cfg.poll.options || []).forEach((o) => {
      const pct = Math.round(((counts[o.id] || 0) / total) * 100);
      const pctEl = $(`[data-pct-for="${o.id}"]`, box);
      if (pctEl) {
        pctEl.textContent = pct + '%';
        pctEl.closest('.poll-option').querySelector('.poll-bar span').style.setProperty('--w', pct + '%');
      }
    });
    setStatus(form, `${total} vote${total === 1 ? '' : 's'} so far.`, 'ok');
  }
  async function loadResults() {
    if (!liveResults) return;
    try { const res = await fetch(`${r.endpoint}?action=poll`); const j = await res.json(); if (j.counts) showResults(j.counts); }
    catch { /* results are optional */ }
  }

  if (myVote) {
    lock(myVote);
    setStatus(form, 'You have voted. Thank you.', 'ok');
    loadResults();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const choice = (new FormData(form)).get('vote');
    if (!choice) { setStatus(form, 'Choose one option first.', 'error'); return; }
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    try {
      const label = (cfg.poll.options.find((o) => o.id === choice) || {}).label || choice;
      const res = await send('vote', { vote: choice, label });
      store.set('vote', choice);
      lock(choice);
      setStatus(form, res.mailto ? 'Your email app has opened. Send the email to count your vote.' : 'Vote counted. Thank you.', 'ok');
      loadResults();
    } catch (err) {
      setStatus(form, errorText(err), 'error');
    } finally { btn.disabled = false; }
  });
}

/* ---------- Start ---------- */

initNav();
updateStatus();
initTrace();
initIcs();
initShare();
initProgramme();
initTopics();
initRegistration();
initCapacity();
initQuestions();
initPoll();
