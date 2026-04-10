// build.js — runs on Vercel at deploy time
const fs   = require('fs');
const path = require('path');

const SB_URL   = process.env.SB_URL   || '';
const SB_KEY   = process.env.SB_KEY   || '';
const NAS_URL  = process.env.NAS_URL  || '';
const NAS_USER = process.env.NAS_USER || 'admin';
const NAS_PASS = process.env.NAS_PASS || '';

let html = fs.readFileSync('index.html', 'utf8');

const oldENV = `const ENV = {
  SB_URL:   typeof __SB_URL__   !== 'undefined' ? __SB_URL__   : null,
  SB_KEY:   typeof __SB_KEY__   !== 'undefined' ? __SB_KEY__   : null,
  NAS_URL:  typeof __NAS_URL__  !== 'undefined' ? __NAS_URL__  : null,
  NAS_USER: typeof __NAS_USER__ !== 'undefined' ? __NAS_USER__ : null,
  NAS_PASS: typeof __NAS_PASS__ !== 'undefined' ? __NAS_PASS__ : null,
};`;

const newENV = `const ENV = {
  SB_URL:   ${JSON.stringify(SB_URL)},
  SB_KEY:   ${JSON.stringify(SB_KEY)},
  NAS_URL:  ${JSON.stringify(NAS_URL)},
  NAS_USER: ${JSON.stringify(NAS_USER)},
  NAS_PASS: ${JSON.stringify(NAS_PASS)},
};`;

if (!html.includes(oldENV)) {
  console.error('Could not find ENV block in index.html');
  process.exit(1);
}

html = html.replace(oldENV, newENV);

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', 'index.html'), html);

console.log('VaultDrive built successfully');
console.log('SB_URL:  ', SB_URL   ? 'set: ' + SB_URL  : 'MISSING');
console.log('SB_KEY:  ', SB_KEY   ? 'set'              : 'MISSING');
console.log('NAS_URL: ', NAS_URL  ? 'set: ' + NAS_URL  : 'MISSING');
console.log('NAS_USER:', NAS_USER ? 'set: ' + NAS_USER : 'MISSING');
console.log('NAS_PASS:', NAS_PASS ? 'set'              : 'MISSING');
