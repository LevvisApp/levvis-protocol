// Gate warning: never blanket-reject 0x hex. Any 0x + 40 hex digits, any case, is accepted.
export const isAddress = (v) => typeof v === 'string' && /^0x[0-9a-fA-F]{40}$/.test(v);

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function caMarkup(rec) {
  if (rec && rec.state === 'stated' && isAddress(rec.value)) {
    const a = esc(rec.value);
    return (
      `<button type="button" class="ca-btn" data-copy="${a}" aria-label="Copy contract address ${a}">` +
      `<span class="ca-label">CA</span><span class="ca-val">${a}</span>` +
      `<span class="ca-hint" data-hint>Copy</span></button>`
    );
  }
  return (
    `<div class="ca-btn is-inert" aria-disabled="true">` +
    `<span class="ca-label">CA</span><span class="ca-val ca-val--empty">Not announced yet</span></div>`
  );
}
