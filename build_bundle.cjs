const fs = require('fs');

function cleanModule(code) {
  return code
    .replace(/import\s+[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/export\s+(default\s+)?/g, '')
    .replace(/\bconst\s+COUNTRY_TIMEZONE_MAP\b/g, 'var COUNTRY_TIMEZONE_MAP');
}

let astro = cleanModule(fs.readFileSync('js/astronomy-core.js', 'utf8'));
let prayer = cleanModule(fs.readFileSync('js/prayer-core.js', 'utf8'));
let i18n = cleanModule(fs.readFileSync('js/i18n.js', 'utf8'));
let app = cleanModule(fs.readFileSync('js/app.js', 'utf8'))
  .replace(/const\s+getJD_Mujaib\s*=\s*getJD;/, 'var getJD_Mujaib = getJD;');

const bundle = [
  '// Ibn al-Shatir Simulator Standalone Bundle (Supports file:// protocol and offline use)',
  '(() => {',
  i18n,
  astro,
  prayer,
  'window.i18n = new I18nManager();',
  'if (document.readyState === "loading") {',
  '  document.addEventListener("DOMContentLoaded", () => window.i18n.init());',
  '} else {',
  '  window.i18n.init();',
  '}',
  app,
  '})();'
].join('\n\n');

if (!fs.existsSync('dist')) fs.mkdirSync('dist');
fs.writeFileSync('dist/bundle.js', bundle, 'utf8');
fs.writeFileSync('js/bundle.js', bundle, 'utf8');
console.log('Bundle written successfully to js/bundle.js & dist/bundle.js, size:', bundle.length, 'bytes');

