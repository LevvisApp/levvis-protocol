// Register pattern: each outside fact is held as one record, tagged with a state.
// state: 'stated' | 'absent' | 'unconfirmed'
export const STATES = ['stated', 'absent', 'unconfirmed'];

export const REGISTER = [
  { id: 'network', label: 'Network', value: 'Robinhood Chain', state: 'stated' },
  { id: 'chain-id', label: 'Chain ID', value: '4663', state: 'stated' },
  { id: 'rpc', label: 'Public RPC', url: 'https://rpc.mainnet.chain.robinhood.com', state: 'stated' },
  { id: 'domain', label: 'Domain', url: 'https://levvis.app', state: 'stated' },
  { id: 'ca', label: 'Contract address', value: null, state: 'absent' },
  { id: 'x', label: 'X', url: null, state: 'absent' },
  { id: 'github', label: 'GitHub', url: null, state: 'absent' },
  { id: 'brand-assets', label: 'Brand assets', value: null, state: 'absent' },
];

export const get = (id, reg = REGISTER) => reg.find((r) => r.id === id);
export const isStated = (rec) => !!rec && rec.state === 'stated';
