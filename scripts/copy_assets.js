const fs = require('fs');
const path = require('path');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// 1. Copy src/ui to dist/ui
const uiSrc = path.join(__dirname, '..', 'src', 'ui');
const uiDest = path.join(__dirname, '..', 'dist', 'ui');
if (fs.existsSync(uiSrc)) {
  copyRecursiveSync(uiSrc, uiDest);
  console.log('Copied src/ui -> dist/ui');
}

// 2. Copy assets to dist/assets
const assetsSrc = path.join(__dirname, '..', 'assets');
const assetsDest = path.join(__dirname, '..', 'dist', 'assets');
if (fs.existsSync(assetsSrc)) {
  copyRecursiveSync(assetsSrc, assetsDest);
  console.log('Copied assets -> dist/assets');
}

// 3. Copy xterm browser distribution files to dist/ui/vendor/xterm
const xtermPkgDir = path.join(__dirname, '..', 'node_modules', '@xterm');
const vendorDest = path.join(uiDest, 'vendor');

if (fs.existsSync(xtermPkgDir)) {
  fs.mkdirSync(vendorDest, { recursive: true });
  
  // xterm core
  const xtermJs = path.join(xtermPkgDir, 'xterm', 'lib', 'xterm.js');
  const xtermCss = path.join(xtermPkgDir, 'xterm', 'css', 'xterm.css');
  if (fs.existsSync(xtermJs)) copyRecursiveSync(xtermJs, path.join(vendorDest, 'xterm.js'));
  if (fs.existsSync(xtermCss)) copyRecursiveSync(xtermCss, path.join(vendorDest, 'xterm.css'));

  // fit addon
  const fitJs = path.join(xtermPkgDir, 'addon-fit', 'lib', 'addon-fit.js');
  if (fs.existsSync(fitJs)) copyRecursiveSync(fitJs, path.join(vendorDest, 'addon-fit.js'));

  // web links addon
  const webLinksJs = path.join(xtermPkgDir, 'addon-web-links', 'lib', 'addon-web-links.js');
  if (fs.existsSync(webLinksJs)) copyRecursiveSync(webLinksJs, path.join(vendorDest, 'addon-web-links.js'));

  // search addon
  const searchJs = path.join(xtermPkgDir, 'addon-search', 'lib', 'addon-search.js');
  if (fs.existsSync(searchJs)) copyRecursiveSync(searchJs, path.join(vendorDest, 'addon-search.js'));

  console.log('Copied xterm vendor files -> dist/ui/vendor');
}

console.log('Asset copy completed successfully.');
