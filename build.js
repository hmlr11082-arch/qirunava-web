const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const srcDir = path.join(rootDir, 'src');

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getRootPrefix(pageFile) {
  const dir = path.posix.dirname(pageFile);
  if (!dir || dir === '.') return '';
  const depth = dir.split('/').filter(Boolean).length;
  return '../'.repeat(depth);
}

function normalizeRootRelativeUrls(pageHtml, pageFile) {
  const rootPrefix = getRootPrefix(pageFile);
  return pageHtml.replace(/(["'])(\/[^"'`]*?)(\1)/g, (match, quote, url) => {
    if (!url || url.startsWith('//') || url.startsWith('data:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('javascript:')) {
      return match;
    }

    const stripped = url.replace(/^\//, '');
    if (!stripped) {
      return `${quote}${rootPrefix || './'}${quote}`;
    }
    return `${quote}${rootPrefix}${stripped}${quote}`;
  });
}

function normalizeCssUrls(dir) {
  if (!fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    if (file.endsWith('.css')) {
      const cssPath = path.join(dir, file);
      const css = fs.readFileSync(cssPath, 'utf8');
      const updated = css.replace(/url\((["']?)\/(art|characters|icons|backgrounds|_next)\//g, 'url($1../../../$2/');
      if (updated !== css) {
        fs.writeFileSync(cssPath, updated, 'utf8');
      }
    }
  }
}

console.log('Cleaning and preparing dist directory...');
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

console.log('Copying public assets to dist...');
copyDirSync(publicDir, distDir);
normalizeCssUrls(path.join(distDir, '_next/static/chunks'));

const landingHead = fs.readFileSync(path.join(srcDir, 'landing_head.html'), 'utf8');
const landingMain = fs.readFileSync(path.join(srcDir, 'landing_main.html'), 'utf8');
const landingScript = fs.readFileSync(path.join(srcDir, 'landing_script.html'), 'utf8');

const guideHead = fs.readFileSync(path.join(srcDir, 'guide_head.html'), 'utf8');
const guideMain = fs.readFileSync(path.join(srcDir, 'guide_main.html'), 'utf8');
const guideScript = fs.readFileSync(path.join(srcDir, 'guide_script.html'), 'utf8');

const baseStyle = '<style>html, body { margin: 0; padding: 0; overflow-x: hidden; width: 100%; }</style>';

const landingPage = '<!DOCTYPE html>\n<html lang="th" class="celestial-ink ILzWiW_variable r_a_0W_variable Wd414a_variable">\n' +
  landingHead.replace('</head>', baseStyle + '</head>') + '\n<body>\n' +
  landingMain + '\n' + landingScript + '\n</body>\n</html>';

const guidePage = '<!DOCTYPE html>\n<html lang="th" class="celestial-ink ILzWiW_variable r_a_0W_variable Wd414a_variable">\n' +
  guideHead.replace('</head>', baseStyle + '</head>') + '\n<body>\n' +
  guideMain + '\n' + guideScript + '\n</body>\n</html>';

function writePage(relPath, content) {
  const fullPath = path.join(distDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const finalContent = normalizeRootRelativeUrls(content, relPath);
  fs.writeFileSync(fullPath, finalContent, 'utf8');
  console.log('Wrote', relPath);
}

writePage('index.html', landingPage);
writePage('th/index.html', landingPage);
writePage('th/guide/index.html', guidePage);
writePage('th/worlds/index.html', landingPage);
writePage('th/w/e9ed8dfd-166b-4ae1-8a10-5fbe4b88c27a/city/index.html', landingPage);

fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log('Created .nojekyll for GitHub Pages');
console.log('Build completed successfully!');
