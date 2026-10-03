import { safeImage, cleanText, num } from './sanitize.js';

const RPC = 'https://rpc.mainnet.chain.robinhood.com';

async function timed(url, init = {}, ms = 8000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { ...init, signal: ctl.signal });
    if (!r.ok) throw new Error('http ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

const rpc = (method) =>
  timed(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: [] }),
  }).then((j) => {
    if (j.error) throw new Error(j.error.message);
    return j.result;
  });

export async function readNode() {
  const [block, gas, id] = await Promise.all([rpc('eth_blockNumber'), rpc('eth_gasPrice'), rpc('eth_chainId')]);
  return {
    block: Number(BigInt(block)),
    gwei: Number(BigInt(gas)) / 1e9,
    chainId: Number(BigInt(id)),
  };
}

export async function readTvl() {
  const list = await timed('https://api.llama.fi/v2/chains');
  const hit = list.find((c) => /robinhood/i.test(c.name || ''));
  return hit ? { tvl: Number(hit.tvl) } : { tvl: null };
}

export async function readPairs() {
  const j = await timed('https://api.dexscreener.com/latest/dex/search?q=robinhood%20chain');
  const rows = (j.pairs || []).filter((p) => /robinhood/i.test(p.chainId || ''));
  return { count: rows.length };
}

export async function readTokens() {
  const profiles = await timed('https://api.dexscreener.com/token-profiles/latest/v1');
  const rows = (Array.isArray(profiles) ? profiles : []).filter(
    (p) => p && p.chainId === 'robinhood' && /^0x[0-9a-fA-F]{40}$/.test(p.tokenAddress || ''),
  );
  if (!rows.length) return [];
  const addrs = [...new Set(rows.map((p) => p.tokenAddress))].slice(0, 30);
  const pairs = await timed(`https://api.dexscreener.com/tokens/v1/robinhood/${addrs.join(',')}`);
  const best = new Map();
  for (const p of Array.isArray(pairs) ? pairs : []) {
    const a = p && p.baseToken && String(p.baseToken.address || '').toLowerCase();
    if (!a) continue;
    const liq = num(p.liquidity && p.liquidity.usd) || 0;
    if (!best.has(a) || liq > best.get(a).liq) best.set(a, { p, liq });
  }
  const out = [];
  for (const prof of rows) {
    const hit = best.get(prof.tokenAddress.toLowerCase());
    if (!hit) continue;
    const { p } = hit;
    const symbol = cleanText(p.baseToken.symbol, 12);
    const name = cleanText(p.baseToken.name, 22) || symbol;
    if (!name) continue;
    out.push({
      name,
      symbol,
      logo: safeImage(prof.icon) || safeImage(p.info && p.info.imageUrl),
      price: num(p.priceUsd),
      change: num(p.priceChange && p.priceChange.h24),
    });
  }
  return out;
}
