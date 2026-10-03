export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

const ease = (t) => 1 - Math.pow(1 - t, 3);

// Count a number toward its target; flash the cell when the value changes.
export function setNumber(el, value, { decimals = 0, prefix = '', suffix = '', compact = false } = {}) {
  const fmt = (n) => {
    const body = compact
      ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(n)
      : new Intl.NumberFormat('en', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
    return prefix + body + suffix;
  };
  const prev = el._v;
  el._v = value;
  el.classList.remove('skel');
  el.removeAttribute('data-state');
  if (el._raf) cancelAnimationFrame(el._raf);
  if (reduced() || prev === value) {
    el.textContent = fmt(value);
  } else {
    const from = prev == null ? 0 : prev;
    const start = performance.now();
    const dur = prev == null ? 1100 : 600;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = fmt(from + (value - from) * ease(p));
      if (p < 1) el._raf = requestAnimationFrame(tick);
      else el.textContent = fmt(value);
    };
    el._raf = requestAnimationFrame(tick);
  }
  if (prev != null && prev !== value) {
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  }
}

export function setText(el, text, state) {
  el.classList.remove('skel');
  el.textContent = text;
  if (state) el.setAttribute('data-state', state);
  else el.removeAttribute('data-state');
}

export function initReveal() {
  const els = [...document.querySelectorAll('.reveal')];
  if (reduced() || !('IntersectionObserver' in window)) {
    els.forEach((e) => e.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  els.forEach((e) => io.observe(e));
}

export function initScroll() {
  const bar = document.getElementById('progress');
  const layers = [...document.querySelectorAll('[data-depth]')];
  let queued = false;
  const frame = () => {
    queued = false;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    if (!reduced()) for (const l of layers) l.style.transform = `translate3d(0, ${(y * Number(l.dataset.depth)).toFixed(1)}px, 0)`;
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(frame);
    }
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  frame();
}

export function initCopy() {
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const hint = b.querySelector('[data-hint]');
    try {
      await navigator.clipboard.writeText(b.dataset.copy);
      if (hint) hint.textContent = 'Copied';
    } catch {
      if (hint) hint.textContent = 'Select to copy';
    }
    b.classList.add('done');
    setTimeout(() => {
      if (hint) hint.textContent = 'Copy';
      b.classList.remove('done');
    }, 1600);
  });
}
