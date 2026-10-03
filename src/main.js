import './tokens.css';
import './style.css';
import { REGISTER, get, isStated } from './register.js';
import { hrefFor, deriveHandle } from './links.js';
import { caMarkup } from './ca.js';
import { readNode, readTvl, readPairs, readTokens } from './live.js';
import { formatPrice, formatChange } from './sanitize.js';
import { setNumber, setText, initReveal, initScroll, initCopy } from './motion.js';

document.documentElement.classList.add('js');

const $ = (s) => document.querySelector(s);

/* CA slot */
$('#ca').innerHTML = caMarkup(get('ca'));

/* Socials: icon-only, inert until stated */
const ICONS = {
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  github:
    'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
};
$('#socials').innerHTML = ['x', 'github']
  .map((id) => {
    const rec = get(id);
    const href = hrefFor(rec);
    const handle = deriveHandle(rec.url);
    const svg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[id]}"/></svg>`;
    return href
      ? `<a class="icon-btn" href="${href}" target="_blank" rel="noopener noreferrer" aria-label="${rec.label}${handle ? ' ' + handle : ''}">${svg}</a>`
      : `<span class="icon-btn is-inert" aria-disabled="true" role="img" aria-label="${rec.label}, not announced yet">${svg}</span>`;
  })
  .join('');

/* Facts register */
const stateLabel = { stated: 'stated', absent: 'not announced', unconfirmed: 'unconfirmed' };
const factValue = (r) => {
  if (r.state !== 'stated') return '<span class="muted">Not announced</span>';
  const text = r.url ? r.url.replace(/^https?:\/\//, '') : r.value;
  return text;
};
$('#facts-list').innerHTML = REGISTER.filter((r) => r.id !== 'brand-assets')
  .map(
    (r, i) =>
      `<div class="fact reveal" style="--i:${i}"><dt>${r.label}</dt><dd>${factValue(r)}</dd>` +
      `<span class="tag" data-state="${r.state}">${stateLabel[r.state]}</span></div>`,
  )
  .join('');
if (!isStated(get('brand-assets'))) $('#unsampled').hidden = false;

/* Marquee: live token chips, built with DOM APIs only (no HTML from the network) */
const track = $('#track');
const skelChips = () => {
  track.replaceChildren();
  for (let i = 0; i < 12; i++) {
    const c = document.createElement('span');
    c.className = 'chip chip--skel';
    track.append(c);
  }
};
skelChips();
const chipFor = (t) => {
  const c = document.createElement('span');
  c.className = 'chip';
  const box = document.createElement('span');
  box.className = 'logo';
  if (t.logo) {
    const img = new Image();
    img.alt = '';
    img.width = img.height = 28;
    img.decoding = 'async';
    img.referrerPolicy = 'no-referrer';
    img.addEventListener('error', () => img.remove());
    img.src = t.logo;
    box.append(img);
  }
  box.dataset.initial = (t.symbol || t.name).slice(0, 1).toUpperCase();
  const nm = document.createElement('span');
  nm.className = 'tk-name';
  nm.textContent = t.name;
  const px = document.createElement('span');
  px.className = 'tk-px';
  px.textContent = formatPrice(t.price);
  const ch = formatChange(t.change);
  const chg = document.createElement('span');
  chg.className = 'tk-chg';
  chg.dataset.dir = ch.dir;
  chg.textContent = ch.text;
  c.append(box, nm, px, chg);
  return c;
};
async function pollTokens() {
  try {
    const list = await readTokens();
    if (!list.length) throw new Error('empty');
    const frag = document.createDocumentFragment();
    // enough copies that one half always overfills the viewport, then doubled for the seamless -50% loop
    const reps = Math.max(1, Math.ceil(12 / list.length));
    const half = [];
    for (let r = 0; r < reps; r++) for (const t of list) half.push(t);
    for (let k = 0; k < 2; k++) for (const t of half) frag.append(chipFor(t));
    track.replaceChildren(frag);
    track.closest('.marquee').hidden = false;
  } catch {
    if (!track.querySelector('.chip:not(.chip--skel)')) track.closest('.marquee').hidden = true;
  }
}
pollTokens();
setInterval(pollTokens, 120000);

/* Live data */
const status = $('#status');
const setStatus = (kind, text) => {
  status.dataset.kind = kind;
  status.querySelector('[data-label]').textContent = text;
};
const el = (id) => document.getElementById(id);

async function pollNode() {
  try {
    const n = await readNode();
    setNumber(el('v-block'), n.block);
    setNumber(el('v-gas'), n.gwei, { decimals: 4 });
    setStatus('live', n.chainId === 4663 ? 'Live' : 'Chain mismatch');
    setText(el('n-block'), n.chainId === 4663 ? 'Height of the newest block' : 'RPC answered with another chain id');
  } catch {
    for (const id of ['v-block', 'v-gas']) setText(el(id), '—', 'error');
    setStatus('down', 'Offline');
  }
}
async function pollTvl() {
  try {
    const { tvl } = await readTvl();
    if (tvl == null) setText(el('v-tvl'), 'Unlisted', 'error');
    else setNumber(el('v-tvl'), tvl, { prefix: '$', compact: true });
  } catch {
    setText(el('v-tvl'), '—', 'error');
  }
}
async function pollPairs() {
  try {
    const { count } = await readPairs();
    setNumber(el('v-pairs'), count);
  } catch {
    setText(el('v-pairs'), '—', 'error');
  }
}

pollNode();
pollTvl();
pollPairs();
setInterval(pollNode, 12000);
setInterval(pollTvl, 180000);
setInterval(pollPairs, 90000);

initReveal();
initScroll();
initCopy();
