// Link rule: store the URL, derive the handle. No href for unstated records.
export function hrefFor(rec) {
  return rec && rec.state === 'stated' && rec.url ? rec.url : null;
}

export function deriveHandle(url) {
  if (!url) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '');
  const seg = u.pathname.split('/').filter(Boolean)[0];
  if (!seg) return null;
  if (host === 'x.com' || host === 'twitter.com') return '@' + seg;
  if (host === 'github.com') return seg;
  return null;
}
