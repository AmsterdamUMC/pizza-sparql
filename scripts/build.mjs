// Build the GitHub Pages site into docs/.
//  1. bundles src/engine.js (Comunica + N3) into docs/vendor/engine.js
//  2. encrypts every source/*.ttl file into docs/data/<name>.enc
//     The data is encrypted with one random AES-256-GCM key; that key is
//     wrapped once per user with a key derived (PBKDF2-SHA256) from
//     "username:password". Users come from users.local.json (git-ignored):
//       { "student": "some-password", "teacher": "other-password" }
import { build } from 'esbuild';
import { webcrypto as crypto } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'docs');
const ITER = 250000;

await build({
  entryPoints: [path.join(root, 'src/engine.js')],
  bundle: true, minify: true, format: 'esm', platform: 'browser',
  target: 'es2022', outfile: path.join(out, 'vendor/engine.js'),
  define: { 'process.env.NODE_ENV': '"production"', global: 'globalThis' },
  inject: [path.join(root, 'src/shims.js')],
});

const usersFile = path.join(root, 'users.local.json');
if (!fs.existsSync(usersFile)) {
  console.error('Missing users.local.json, e.g. {"student": "a-good-password"}');
  process.exit(1);
}
const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
const b64 = (buf) => Buffer.from(buf).toString('base64');
const enc = new TextEncoder();

const dataKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
const rawKey = await crypto.subtle.exportKey('raw', dataKey);

const keys = {};
for (const [user, pw] of Object.entries(users)) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const base = await crypto.subtle.importKey('raw', enc.encode(`${user.trim().toLowerCase()}:${pw}`), 'PBKDF2', false, ['deriveKey']);
  const kek = await crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, rawKey);
  keys[user.trim().toLowerCase()] = { salt: b64(salt), iv: b64(iv), key: b64(wrapped) };
}

const datasets = [];
fs.mkdirSync(path.join(out, 'data'), { recursive: true });
for (const f of fs.readdirSync(path.join(root, 'source')).filter((f) => f.endsWith('.ttl'))) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dataKey, fs.readFileSync(path.join(root, 'source', f)));
  const name = f.replace(/\.ttl$/, '');
  fs.writeFileSync(path.join(out, 'data', `${name}.enc`), JSON.stringify({ iv: b64(iv), data: b64(ct) }));
  datasets.push(name);
}
fs.writeFileSync(path.join(out, 'data', 'keys.json'), JSON.stringify({ iterations: ITER, users: keys, datasets }, null, 1));
console.log(`Built docs/ for ${Object.keys(keys).length} user(s), datasets: ${datasets.join(', ')}`);
