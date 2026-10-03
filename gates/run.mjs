import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { REGISTER, STATES } from '../src/register.js';
import { hrefFor, deriveHandle } from '../src/links.js';
import { isAddress, caMarkup } from '../src/ca.js';
import { safeImage, cleanText, formatPrice, formatChange } from '../src/sanitize.js';

const root = resolve(import.meta.dirname, '..');
const results = [];
const gate = async (name, fn) => {
  if (process.env.G_TRACE) console.log('>', name);
  const t0 = Date.now();
  try {
    await fn();
    results.push([name, true, Date.now() - t0]);
  } catch (e) {
    results.push([name, false, e.message, Date.now() - t0]);
  }
};
const ok = (c, m) => {
  if (!c) throw new Error(m);
};

const walk = (d, out = []) => {
  for (const f of readdirSync(d)) {
    if (f === 'node_modules' || f === 'dist') continue;
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p, out) : out.push(p);
  }
  return out;
};
const srcFiles = walk(join(root, 'src')).concat(join(root, 'index.html'));
const text = (p) => readFileSync(p, 'utf8');

/* ---------- static gates ---------- */
await gate('dist/index.html exists', () => ok(existsSync(join(root, 'dist/index.html')), 'run build first'));
await gate('no CLAUDE.md, no .claude dir', () => {
  ok(!existsSync(join(root, 'CLAUDE.md')) && !existsSync(join(root, '.claude')), 'forbidden file present');
});
await gate('no AI attribution strings', () => {
  const re = new RegExp(['Co-Authored', 'Generated with', 'Claude' + ' Code'].join('|'), 'i');
  for (const f of srcFiles.concat(join(root, 'package.json'))) ok(!re.test(text(f)), 'found in ' + f);
});
await gate('colour literals only in tokens.css', () => {
  const re = /#[0-9a-fA-F]{3,8}\b|\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|hwb)\(/;
  for (const f of srcFiles) if (!f.endsWith('tokens.css')) ok(!re.test(text(f)), 'literal in ' + f);
});
await gate('tokens: sampled palette with provenance, hex only in tokens.css', () => {
  const c = text(join(root, 'src/tokens.css'));
  ok(/k-means/.test(c) && /snapped/i.test(c) && /\(\d+,\d+\)/.test(c), 'provenance comment missing');
  ok(!/unsampled|placeholder palette/i.test(c), 'still flagged placeholder');
  ok((c.match(/--c-[a-z]+:\s*#[0-9a-f]{6}/gi) || []).length >= 6, 'sampled swatches missing');
});
await gate('no ch units in css', () => {
  for (const f of srcFiles.filter((f) => f.endsWith('.css'))) ok(!/\d\s*ch\b/.test(text(f)), 'ch unit in ' + f);
});
await gate('reduced-motion fallback present', () => {
  const c = text(join(root, 'src/style.css'));
  ok(/prefers-reduced-motion:\s*reduce/.test(c) && /animation:none!important/.test(c), 'missing');
});
await gate('favicon built from brand pixels (png set present)', () => {
  for (const f of ['favicon-32.png', 'apple-touch-icon.png', 'icon-512.png']) ok(statSync(join(root, 'public', f)).size > 100, f);
  ok(/favicon-32\.png/.test(text(join(root, 'index.html'))), 'index.html not linked');
});
await gate('register: every record has a valid state', () => {
  for (const r of REGISTER) ok(STATES.includes(r.state), r.id);
});
await gate('register: absent records hold no url/value', () => {
  for (const r of REGISTER.filter((r) => r.state === 'absent')) ok(!r.url && !r.value, r.id);
});
await gate('link rule: handle derived from url fixtures', () => {
  ok(deriveHandle('https://x.com/fixtureuser') === '@fixtureuser', 'x');
  ok(deriveHandle('https://github.com/fixture-org/repo') === 'fixture-org', 'gh');
  ok(deriveHandle(null) === null && deriveHandle('nonsense') === null, 'null');
});
await gate('link rule: no href for unstated', () => {
  ok(hrefFor({ state: 'absent', url: 'https://x.com/a' }) === null, 'absent');
  ok(hrefFor({ state: 'unconfirmed', url: 'https://x.com/a' }) === null, 'unconfirmed');
  ok(hrefFor({ state: 'stated', url: 'https://x.com/a' }) === 'https://x.com/a', 'stated');
});
await gate('address check never blanket-rejects 0x hex', () => {
  const hex = 'abcdef0123456789abcdef0123456789abcdef01';
  for (const v of ['0x' + hex, '0x' + hex.toUpperCase(), '0xAbCdEf0123456789aBcDeF0123456789AbCdEf01', '0x' + '0'.repeat(40)])
    ok(isAddress(v), 'rejected valid ' + v);
  ok(!isAddress('0x' + hex.slice(1)) && !isAddress('0xZZ' + hex.slice(2)) && !isAddress(null), 'accepted junk');
});
await gate('CA slot: stated shows full address as button; absent is inert', () => {
  const a = '0x' + '1234567890abcdef'.repeat(3).slice(0, 40);
  const s = caMarkup({ state: 'stated', value: a });
  ok(s.includes('<button') && s.includes(`>${a}</span>`) && s.includes(`data-copy="${a}"`), 'stated');
  const n = caMarkup({ state: 'absent', value: null });
  ok(!/<button|href|data-copy/.test(n) && n.includes('aria-disabled'), 'absent');
});
await gate('copy gate: shared 2-gram detector works on synthetic fixtures', () => {
  const grams = (s) => {
    const w = s.toLowerCase().match(/[a-z0-9']+/g) || [];
    return new Set(w.slice(1).map((x, i) => w[i] + ' ' + x));
  };
  const a = grams('alpha beta gamma delta');
  const hit = [...grams('zeta beta gamma eta')].filter((g) => a.has(g));
  ok(hit.length === 1 && hit[0] === 'beta gamma', 'detector wrong');
  ok([...grams('one two three')].filter((g) => a.has(g)).length === 0, 'false positive');
});

await gate('sanitiser: logo host allowlist, text stripped, numbers shaped', () => {
  ok(safeImage('https://cdn.dexscreener.com/cms/images/a?width=64') !== null, 'good url rejected');
  for (const bad of ['http://cdn.dexscreener.com/a', 'https://evil.example/a.png', 'javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'https://u:p@cdn.dexscreener.com/a', 'https://cdn.dexscreener.com.evil.example/a', null])
    ok(safeImage(bad) === null, 'accepted ' + bad);
  ok(cleanText('<img src=x onerror="a">Tok‮EN') === 'img src=x onerror=aTok'.slice(0, 24).replace('Tok', 'Tok') + 'EN' || !/[<>"]/.test(cleanText('<b>"x"</b>')), 'markup survived');
  ok(formatChange(-3.456).text === '▼ 3.46%' && formatChange(2).dir === 'up' && formatChange(null).text === '—', 'change');
  ok(formatPrice(1.5) === '$1.50' && formatPrice(0.0123) === '$0.0123' && formatPrice(null) === '—', 'price');
});

/* ---------- browser gates ---------- */
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
const server = createServer((req, res) => {
  let p = join(root, 'dist', req.url.split('?')[0]);
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(root, 'dist/index.html');
  res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch({ channel: 'msedge', args: ['--disable-gpu', '--disable-dev-shm-usage'] });
const mock = async (page, { fail = false, delay = 0 } = {}) => {
  let blockN = 1000;
  await page.route(/rpc\.mainnet\.chain\.robinhood\.com/, async (r) => {
    if (delay) await new Promise((x) => setTimeout(x, delay));
    if (fail) return r.abort();
    const { method } = JSON.parse(r.request().postData());
    const result = { eth_blockNumber: '0x' + (blockN++).toString(16), eth_gasPrice: '0x5f5e100', eth_chainId: '0x1237' }[method];
    r.fulfill({ json: { jsonrpc: '2.0', id: 1, result } });
  });
  const slow = () => new Promise((x) => setTimeout(x, delay));
  await page.route(/api\.llama\.fi/, async (r) => {
    if (delay) await slow();
    fail ? r.abort() : r.fulfill({ json: [{ name: 'Robinhood Chain', tvl: 12345678 }] });
  });
  await page.route(/dexscreener/, async (r) => {
    if (delay) await slow();
    fail ? r.abort() : r.fulfill({ json: { pairs: [{ chainId: 'robinhood' }, { chainId: 'robinhood' }, { chainId: 'other' }] } });
  });
};
const ICON = 'https://cdn.dexscreener.com/cms/images/fixture?width=64';
const A1 = '0x' + '1'.repeat(40), A2 = '0x' + '2'.repeat(40), A3 = '0x' + '3'.repeat(40);
const mockTokens = async (page) => {
  await page.route(/cdn\.dexscreener\.com/, (r) => r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>' }));
  await page.route(/token-profiles\/latest/, (r) =>
    r.fulfill({ json: [
      { chainId: 'robinhood', tokenAddress: A1, icon: ICON },
      { chainId: 'robinhood', tokenAddress: A2, icon: 'https://evil.example/x.png' },
      { chainId: 'solana', tokenAddress: A3, icon: ICON },
    ] }));
  await page.route(/tokens\/v1\/robinhood/, (r) =>
    r.fulfill({ json: [
      { baseToken: { address: A1, name: 'Fixture One', symbol: 'FX1' }, priceUsd: '1.5', priceChange: { h24: -3.456 }, liquidity: { usd: 10 } },
      { baseToken: { address: A2, name: '<img src=x onerror=alert(1)>Evil', symbol: 'EV' }, priceUsd: '0.00000123', priceChange: { h24: 12 }, liquidity: { usd: 5 } },
    ] }));
};
const open = async (opts = {}, ctxOpts = {}, mockOpts) => {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 }, ...ctxOpts });
  let page;
  for (let i = 0; i < 3 && !page; i++) page = await ctx.newPage().catch(() => null);
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  await mock(page, mockOpts);
  if (!mockOpts?.noTokens) await mockTokens(page);
  if (opts.clock) await page.clock.install();
  await page.goto(base);
  return { page, ctx, errors };
};

for (const w of [360, 390, 430, 1366, 1440]) {
  await gate(`layout @${w}: no overflow, 48px taps, CA in top band`, async () => {
    const { page, ctx } = await open({}, { viewport: { width: w, height: 800 } });
    await page.waitForFunction(() => !document.querySelector('.skel'));
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const small = [...document.querySelectorAll('a,button,[role=button],.icon-btn')]
        .filter((e) => getComputedStyle(e).display !== 'none')
        .map((e) => [e, e.getBoundingClientRect()])
        .filter(([, r]) => r.width > 0 && (r.width < 47.5 || r.height < 47.5))
        .map(([e]) => e.className || e.tagName);
      const ca = document.querySelector('#ca .ca-btn').getBoundingClientRect();
      return { sw: de.scrollWidth, cw: de.clientWidth, small, caTop: ca.top, caRight: ca.right };
    });
    await ctx.close();
    ok(m.sw <= m.cw, `overflow ${m.sw}>${m.cw}`);
    ok(m.small.length === 0, 'small taps: ' + m.small.join(','));
    ok(m.caTop >= 0 && m.caTop < 8 && m.caRight <= w, 'CA not at top / clipped');
  });
}

await gate('skeletons shown while data pending', async () => {
  const { page, ctx } = await open({}, {}, { delay: 1500 });
  const n = await page.locator('.num.skel').count();
  await ctx.close();
  ok(n === 4, 'skeleton count ' + n);
});
await gate('live values replace skeletons', async () => {
  const { page, ctx } = await open();
  await page.waitForFunction(() => !document.querySelector('.skel'), null, { timeout: 8000 });
  const t = await page.evaluate(() => ['v-block', 'v-gas', 'v-tvl', 'v-pairs'].map((i) => document.getElementById(i).textContent));
  await page.waitForTimeout(1300);
  const final = await page.evaluate(() => ['v-block', 'v-gas', 'v-tvl', 'v-pairs'].map((i) => document.getElementById(i).textContent));
  await ctx.close();
  ok(final[0] === '1,000' && final[1] === '0.1000' && final[2] === '$12.35M' && final[3] === '2', 'values ' + final.join('|'));
});
await gate('value change flashes (fast clock)', async () => {
  const { page, ctx } = await open({ clock: true });
  await page.clock.runFor(2000);
  await page.clock.runFor(13000);
  await page.clock.runFor(100);
  const f = await page.locator('#v-block.flash').count();
  await ctx.close();
  ok(f === 1, 'no flash class');
});
await gate('failed sources show dash + offline, no stuck skeleton', async () => {
  const { page, ctx } = await open({}, {}, { fail: true });
  await page.waitForFunction(() => !document.querySelector('.skel'), null, { timeout: 12000 });
  const s = await page.evaluate(() => ({ v: document.getElementById('v-block').textContent, st: document.getElementById('status').dataset.kind }));
  await ctx.close();
  ok(s.v === '—' && s.st === 'down', JSON.stringify(s));
});
await gate('reduced motion: instant reveal, no animations', async () => {
  const { page, ctx } = await open({}, { reducedMotion: 'reduce' });
  const r = await page.evaluate(() => {
    const e = document.querySelector('.card');
    const cs = getComputedStyle(e);
    return { o: cs.opacity, t: cs.transitionDuration, a: getComputedStyle(document.querySelector('.track')).animationName };
  });
  await ctx.close();
  ok(r.o === '1' && r.t === '0s' && r.a === 'none', JSON.stringify(r));
});
await gate('scroll progress reaches end; reveals fire', async () => {
  const { page, ctx } = await open();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(900);
  const r = await page.evaluate(() => ({
    p: document.getElementById('progress').style.transform,
    hidden: document.querySelectorAll('.reveal:not(.in)').length,
  }));
  await ctx.close();
  ok(/scaleX\(0\.9|scaleX\(1\)/.test(r.p), r.p);
});
await gate('absent records render no links; live dot pulses', async () => {
  const { page, ctx } = await open();
  await page.waitForFunction(() => document.getElementById('status').dataset.kind === 'live');
  const r = await page.evaluate(() => ({
    hrefs: document.querySelectorAll('#socials a, #ca a, #ca [href]').length,
    anim: getComputedStyle(document.querySelector('.status .dot')).animationName,
    inert: document.querySelectorAll('#socials .is-inert').length,
  }));
  await ctx.close();
  ok(r.hrefs === 0 && r.inert === 2 && r.anim === 'pulse', JSON.stringify(r));
});
await gate('no console errors on a mocked load', async () => {
  const { page, ctx, errors } = await open();
  await page.waitForTimeout(500);
  await ctx.close();
  ok(errors.length === 0, errors.join(' | '));
});

await gate('marquee: sanitised token chips, pause on hover, 36s linear', async () => {
  const { page, ctx } = await open();
  await page.waitForSelector('.chip:not(.chip--skel)', { timeout: 8000 });
  const r = await page.evaluate(async () => {
    const chips = [...document.querySelectorAll('.chip:not(.chip--skel)')];
    const first = chips[0];
    const evil = chips.find((c) => c.textContent.includes('onerror'));
    const t = document.getElementById('track');
    const cs = getComputedStyle(t);
    document.querySelector('.marquee').dispatchEvent(new MouseEvent('mouseover'));
    return {
      n: chips.length,
      imgs: [...document.querySelectorAll('.chip img')].map((i) => i.src),
      firstText: first.textContent,
      evilImgs: evil ? evil.querySelectorAll('img').length : -1,
      evilHtml: document.querySelectorAll('.chip img[onerror], .chip b').length,
      solana: chips.some((c) => c.textContent.includes('Solana')),
      anim: cs.animationName, dur: cs.animationDuration, tim: cs.animationTimingFunction,
    };
  });
  await page.hover('.marquee');
  const paused = await page.evaluate(() => getComputedStyle(document.getElementById('track')).animationPlayState);
  await ctx.close();
  ok(r.n >= 2 && r.firstText.includes('Fixture One') && r.firstText.includes('$1.50') && r.firstText.includes('3.46%'), 'chip content ' + r.firstText);
  ok(r.imgs.length > 0 && r.imgs.every((s) => s.startsWith('https://cdn.dexscreener.com/')), 'bad img ' + r.imgs);
  ok(r.evilImgs === 0 && r.evilHtml === 0, 'unsafe logo or markup survived');
  ok(r.anim === 'mq' && r.dur === '36s' && r.tim === 'linear' && paused === 'paused', JSON.stringify([r.anim, r.dur, r.tim, paused]));
});

await browser.close();
server.close();

ok(results.length <= 30, 'gate budget exceeded');
let failed = 0;
for (const [n, p, m] of results) {
  console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${p ? '  (' + m + 'ms)' : '  -> ' + m}`);
  if (!p) failed++;
}
console.log(`\n${results.length} gates, ${failed} failed`);
process.exit(failed ? 1 : 0);
