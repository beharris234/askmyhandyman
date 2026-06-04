#!/usr/bin/env node
/**
 * Copies the BoneDropper web app (../../bonedropper/*) into ./www for the
 * native build, rewriting the absolute "/bonedropper/..." asset paths to
 * relative paths so they resolve inside the Capacitor webview (which
 * serves files from the app root, not /bonedropper/).
 */
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', '..');      // the /bonedropper folder
const OUT = path.resolve(__dirname, '..', 'www');
const FILES = ['index.html', 'manifest.json', 'sw.js'];

fs.mkdirSync(OUT, { recursive: true });

for (const f of FILES) {
  const from = path.join(SRC, f);
  if (!fs.existsSync(from)) continue;
  let body = fs.readFileSync(from, 'utf8');
  // /bonedropper/foo -> ./foo  and  /bonedropper/ -> ./
  body = body.replace(/(["'(])\/bonedropper\//g, '$1./');
  fs.writeFileSync(path.join(OUT, f), body);
  console.log('synced', f);
}
console.log('\nWeb assets copied to', OUT);
