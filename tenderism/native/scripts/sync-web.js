#!/usr/bin/env node
/**
 * Copies the Tenderism web app (../../tenderism/*) into ./www for the
 * native build, rewriting the absolute "/tenderism/..." asset paths to
 * relative paths so they resolve inside the Capacitor webview (which
 * serves files from the app root, not /tenderism/).
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', '..');      // the /tenderism folder
const OUT = path.resolve(__dirname, '..', 'www');
const FILES = ['index.html', 'manifest.json', 'sw.js'];

fs.mkdirSync(OUT, { recursive: true });

for (const f of FILES) {
  const from = path.join(SRC, f);
  if (!fs.existsSync(from)) continue;
  let body = fs.readFileSync(from, 'utf8');
  // /tenderism/foo -> ./foo  and  /tenderism/ -> ./
  body = body.replace(/(["'(])\/tenderism\//g, '$1./');
  fs.writeFileSync(path.join(OUT, f), body);
  console.log('synced', f);
}
console.log('\nWeb assets copied to', OUT);
