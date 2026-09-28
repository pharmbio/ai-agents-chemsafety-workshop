/**
 * =============================================================================
 *  AI agents for chemical safety | registration backend (Google Apps Script)
 * -----------------------------------------------------------------------------
 *  Stores registrations, panel questions and poll votes in the Google Sheet
 *  this script is attached to. One tab per type is created automatically.
 *
 *  Set-up (full guide in README.md, section "Registro con Google Sheets"):
 *   1. Create a Google Sheet. Extensions > Apps Script. Paste this file.
 *   2. Edit CONFIG below.
 *   3. Deploy > New deployment > Web app.
 *      Execute as: Me.  Who has access: Anyone.
 *   4. Copy the web app URL (ends in /exec) into hugo.toml:
 *        provider = "apps-script"
 *        endpoint = "https://script.google.com/macros/s/XXXX/exec"
 *   After every change to this file: Deploy > Manage deployments > Edit >
 *   Version: New version > Deploy. The URL stays the same.
 * =============================================================================
 */

const CONFIG = {
  EVENT_TITLE: 'AI agents for chemical safety',
  EVENT_DATE_TEXT: 'Tuesday 3 November 2026, 10:00-15:00 CET',
  VENUE_TEXT: 'SciLifeLab, Uppsala Biomedical Centre (BMC), entrance C11, room 3309, Husargatan 3, Uppsala',
  SITE_URL: 'https://example.org/',

  // 0 = no limit. Should match onsiteCapacity in hugo.toml.
  ONSITE_CAPACITY: 0,

  // Refuse a second registration with the same email address.
  BLOCK_DUPLICATE_EMAILS: true,

  // Send a confirmation email to each person who registers.
  // Sent from the Google account that owns the script (daily quota applies).
  SEND_CONFIRMATION: true,

  // Email the organisers for each new registration / question. '' to disable.
  NOTIFY_EMAIL: 'edgar.lopez@uu.se',

  // Must match data/poll.yaml option ids (used to report zero counts).
  POLL_OPTIONS: ['validation', 'regulatory', 'readacross', 'hallucination', 'workflows'],
};

const SHEETS = {
  registration: {
    name: 'Registrations',
    columns: ['submittedAt', 'name', 'email', 'affiliation', 'sector', 'role', 'attendance',
              'lunch', 'diet', 'access', 'interests', 'question', 'consent', 'page'],
  },
  question: {
    name: 'Questions',
    columns: ['submittedAt', 'session', 'question', 'name', 'page'],
  },
  vote: {
    name: 'Votes',
    columns: ['submittedAt', 'vote', 'label'],
  },
};

/* ---------- Web app entry points ---------- */

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const type = String(data.type || '');
    if (!SHEETS[type]) return json({ ok: false, error: 'unknown-type' });

    if (data.website) return json({ ok: true }); // spam honeypot

    if (type === 'registration') {
      const err = checkRegistration(data);
      if (err) return json({ ok: false, error: err });
    }
    if (type === 'question' && !clean(data.question)) return json({ ok: false, error: 'empty' });
    if (type === 'vote' && CONFIG.POLL_OPTIONS.indexOf(String(data.vote)) === -1) return json({ ok: false, error: 'unknown-option' });

    append(type, data);

    if (type === 'registration') {
      if (CONFIG.SEND_CONFIRMATION) sendConfirmation(data);
      notify('New registration: ' + clean(data.name), summary(data, SHEETS.registration.columns));
    }
    if (type === 'question') notify('New question for the panel', summary(data, SHEETS.question.columns));

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'poll') return json({ ok: true, counts: pollCounts() });
  if (action === 'stats') return json(Object.assign({ ok: true }, registrationStats()));
  return json({ ok: true, service: CONFIG.EVENT_TITLE });
}

/* ---------- Registration rules ---------- */

function checkRegistration(d) {
  if (!clean(d.name) || !clean(d.affiliation) || !clean(d.sector) || !clean(d.attendance)) return 'missing';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(d.email))) return 'email';
  if (clean(d.consent) !== 'yes') return 'consent';
  const rows = rowsOf('registration');
  const email = clean(d.email).toLowerCase();
  if (CONFIG.BLOCK_DUPLICATE_EMAILS && rows.some(r => String(r.email).toLowerCase() === email)) return 'duplicate';
  if (CONFIG.ONSITE_CAPACITY > 0 && d.attendance === 'On site') {
    const onsite = rows.filter(r => r.attendance === 'On site').length;
    if (onsite >= CONFIG.ONSITE_CAPACITY) return 'onsite-full';
  }
  return '';
}

function registrationStats() {
  const rows = rowsOf('registration');
  const onsite = rows.filter(r => r.attendance === 'On site').length;
  return { onsite: onsite, online: rows.length - onsite, total: rows.length };
}

function pollCounts() {
  const counts = {};
  CONFIG.POLL_OPTIONS.forEach(id => { counts[id] = 0; });
  rowsOf('vote').forEach(r => { if (r.vote in counts) counts[r.vote]++; });
  return counts;
}

/* ---------- Emails ---------- */

function sendConfirmation(d) {
  const online = d.attendance === 'Online';
  const lines = [
    'Dear ' + clean(d.name) + ',',
    '',
    'Thank you for registering for "' + CONFIG.EVENT_TITLE + '".',
    '',
    'When: ' + CONFIG.EVENT_DATE_TEXT,
    online ? 'How: online via Zoom. The link is sent to this address the day before.'
           : 'Where: ' + CONFIG.VENUE_TEXT,
    '',
    'Programme and updates: ' + CONFIG.SITE_URL,
    '',
    'If you can no longer attend, please reply to this email.',
    '',
    'Best regards,',
    'The organisers',
  ];
  MailApp.sendEmail({
    to: clean(d.email),
    subject: 'Registration confirmed: ' + CONFIG.EVENT_TITLE,
    body: lines.join('\n'),
    replyTo: CONFIG.NOTIFY_EMAIL || undefined,
  });
}

function notify(subject, body) {
  if (!CONFIG.NOTIFY_EMAIL) return;
  MailApp.sendEmail(CONFIG.NOTIFY_EMAIL, '[' + CONFIG.EVENT_TITLE + '] ' + subject, body);
}

/* ---------- Sheet helpers ---------- */

function sheetFor(type) {
  const def = SHEETS[type];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    sh.appendRow(def.columns);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, def.columns.length).setFontWeight('bold');
  }
  return sh;
}

function append(type, d) {
  const cols = SHEETS[type].columns;
  const row = cols.map(c => {
    const v = d[c];
    if (c === 'submittedAt') return new Date();
    return Array.isArray(v) ? v.map(clean).join(', ') : clean(v);
  });
  sheetFor(type).appendRow(row);
}

function rowsOf(type) {
  const sh = sheetFor(type);
  const values = sh.getDataRange().getValues();
  const head = values.shift() || [];
  return values.map(r => {
    const o = {};
    head.forEach((h, i) => { o[h] = r[i]; });
    return o;
  });
}

function clean(v) {
  if (v === undefined || v === null) return '';
  // Strip leading characters that spreadsheets would treat as formulas
  return String(v).trim().slice(0, 2000).replace(/^[=+\-@]+/, '');
}

function summary(d, cols) {
  return cols.filter(c => d[c]).map(c => c + ': ' + (Array.isArray(d[c]) ? d[c].join(', ') : d[c])).join('\n');
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/* Run once from the editor to create the tabs and grant permissions. */
function setup() {
  Object.keys(SHEETS).forEach(sheetFor);
}
