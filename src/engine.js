// Browser entry: decrypts the dataset and runs SPARQL with Comunica over an in-memory N3 store.
import { Parser, Store } from 'n3';

// Comunica's official browser build (vendor/comunica-browser.js) provides the global `Comunica`.
let engine = null;
const dec = new TextDecoder();
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function unlock(user, password, base = 'data/') {
  const meta = await (await fetch(base + 'keys.json', { cache: 'no-store' })).json();
  const entry = meta.users[user.trim().toLowerCase()];
  if (!entry) throw new Error('Unknown user name or wrong password');
  const pbkdf = await crypto.subtle.importKey('raw', new TextEncoder().encode(`${user.trim().toLowerCase()}:${password}`), 'PBKDF2', false, ['deriveKey']);
  const kek = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(entry.salt), iterations: meta.iterations },
    pbkdf, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  let raw;
  try {
    raw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(entry.iv) }, kek, unb64(entry.key));
  } catch { throw new Error('Unknown user name or wrong password'); }
  const dataKey = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  const store = new Store();
  for (const name of meta.datasets) {
    const blob = await (await fetch(`${base}${name}.enc`, { cache: 'no-store' })).json();
    const ttl = dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, dataKey, unb64(blob.data)));
    store.addQuads(new Parser().parse(ttl));
  }
  return { store, key: btoa(String.fromCharCode(...new Uint8Array(raw))) };
}

export async function unlockWithKey(rawB64, base = 'data/') {
  const meta = await (await fetch(base + 'keys.json', { cache: 'no-store' })).json();
  const dataKey = await crypto.subtle.importKey('raw', unb64(rawB64), 'AES-GCM', false, ['decrypt']);
  const store = new Store();
  for (const name of meta.datasets) {
    const blob = await (await fetch(`${base}${name}.enc`, { cache: 'no-store' })).json();
    const ttl = dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(blob.iv) }, dataKey, unb64(blob.data)));
    store.addQuads(new Parser().parse(ttl));
  }
  return store;
}

// Comunica asks endpoints with a long Accept header, which makes every request need a CORS
// preflight. DBpedia answers preflights inconsistently across its servers, so requests failed at
// random. Sending only CORS-safelisted headers (a short Accept, form-encoded POST bodies) avoids the
// preflight altogether.
function simpleFetch(input, init = {}) {
  const req = input instanceof Request ? input : null;
  const url = req ? req.url : String(input);
  const given = new Headers(init.headers || req?.headers || {});
  const accept = given.get('accept') || '';
  const headers = new Headers();
  headers.set('accept', /sparql-results\+json/.test(accept) ? 'application/sparql-results+json'
    : /n-triples|turtle/.test(accept) ? 'application/n-triples, text/turtle' : accept.slice(0, 120));
  const ct = given.get('content-type');
  if (ct) headers.set('content-type', ct);
  // no-store: DBpedia marks results cacheable for 30 days without "Vary: Origin", so a copy cached
  // for another site would fail the CORS check here. Fresh requests also keep the data live.
  return fetch(url, { method: init.method || req?.method || 'GET', headers, body: init.body, signal: init.signal || req?.signal, cache: 'no-store' });
}

// Runs any SPARQL query on an in-memory store or on a remote endpoint URL (string).
// Returns {type:'bindings', vars, rows} | {type:'boolean', value} | {type:'quads', quads}
export async function runQuery(source, query) {
  engine ||= new globalThis.Comunica.QueryEngine();
  const remote = typeof source === 'string';
  const result = await engine.query(query, remote
    ? { sources: [{ type: 'sparql', value: source }], httpTimeout: 90000, fetch: simpleFetch }
    : { sources: [source] });
  if (result.resultType === 'bindings') {
    const { variables } = await result.metadata();
    const vars = variables.map((v) => (v.variable || v).value);
    const rows = (await (await result.execute()).toArray()).map((b) => vars.map((v) => b.get(v) || null));
    return { type: 'bindings', vars, rows };
  }
  if (result.resultType === 'boolean') return { type: 'boolean', value: await result.execute() };
  if (result.resultType === 'quads') return { type: 'quads', quads: await (await result.execute()).toArray() };
  return { type: 'void' };
}
