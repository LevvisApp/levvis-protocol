// Everything that comes back from DexScreener is untrusted: allowlist hosts, strip text, shape numbers.
const IMG_HOSTS = ['cdn.dexscreener.com'];

export function safeImage(raw) {
  if (typeof raw !== 'string' || raw.length > 400) return null;
  let u;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  if (!IMG_HOSTS.includes(u.hostname)) return null;
  return u.href;
}

export const cleanText = (v, max = 24) =>
  typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮<>"'`]/g, '').trim().slice(0, max) : '';

export const num = (v) => {
  const n = typeof v === 'string' || typeof v === 'number' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

export function formatPrice(n) {
  if (n == null) return '—';
  if (n >= 1000) return '$' + new Intl.NumberFormat('en', { maximumFractionDigits: 0 }).format(n);
  if (n >= 0.01) return '$' + n.toFixed(n >= 1 ? 2 : 4);
  if (n === 0) return '$0';
  return '$' + n.toPrecision(3).replace(/e-(\d+)$/, (_, e) => '0'.repeat(0) + 'e-' + e);
}

export function formatChange(n) {
  if (n == null) return { text: '—', dir: 'flat' };
  const dir = n > 0 ? 'up' : n < 0 ? 'down' : 'flat';
  const arrow = dir === 'up' ? '▲ ' : dir === 'down' ? '▼ ' : '';
  return { text: arrow + Math.abs(n).toFixed(2) + '%', dir };
}
