// build.js — runs on Vercel at deploy time
// Reads environment variables and injects them into index.html

const fs   = require('fs');
const path = require('path');

const SB_URL   = process.env.SB_URL   || '';
const SB_KEY   = process.env.SB_KEY   || '';
const NAS_URL  = process.env.NAS_URL  || '';
const NAS_USER = process.env.NAS_USER || 'admin';
const NAS_PASS = process.env.NAS_PASS || '';

let html = fs.readFileSync('index.html', 'utf8');

// Replace the ENV block with hardcoded values
html = html.replace(
  /const ENV = \{[\s\S]*?\};/,
  `const ENV = {
  SB_URL:   ${JSON.stringify(SB_URL)},
  SB_KEY:   ${JSON.stringify(SB_KEY)},
  NAS_URL:  ${JSON.stringify(NAS_URL)},
  NAS_USER: ${JSON.stringify(NAS_USER)},
  NAS_PASS: ${JSON.stringify(NAS_PASS)},
};`
);

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', 'index.html'), html);

console.log('✅ VaultDrive built successfully');
console.log('   SB_URL:  ', SB_URL  ? '✓ set' : '✗ missing');
console.log('   SB_KEY:  ', SB_KEY  ? '✓ set' : '✗ missing');
console.log('   NAS_URL: ', NAS_URL ? '✓ set' : '✗ missing');
