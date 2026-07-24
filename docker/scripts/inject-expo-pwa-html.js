#!/usr/bin/env node
/**
 * Expo web.output "single" does not reliably emit app/+html.tsx.
 * Inject PWA install meta + SW registration into dist/index.html after export.
 *
 * Usage: node inject-expo-pwa-html.js <distDir> <appleTitle>
 */
const fs = require('fs');
const path = require('path');

const distDir = process.argv[2] || 'dist';
const appleTitle = process.argv[3] || 'Healan';
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error(`[inject-expo-pwa-html] missing ${indexPath}`);
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');

if (!html.includes('rel="manifest"')) {
  const headBits = [
    '<link rel="manifest" href="/mobile/manifest.json" />',
    '<link rel="icon" type="image/png" href="/mobile/favicon.png" />',
    '<link rel="apple-touch-icon" href="/mobile/icons/apple-touch-icon.png" />',
    '<link rel="apple-touch-icon" sizes="180x180" href="/mobile/icons/apple-touch-icon.png" />',
    '<meta name="apple-mobile-web-app-capable" content="yes" />',
    '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
    `<meta name="apple-mobile-web-app-title" content="${appleTitle}" />`,
    '<meta name="mobile-web-app-capable" content="yes" />',
  ].join('\n');
  html = html.replace(/<\/head>/i, `${headBits}\n</head>`);
}

if (!html.includes('serviceWorker.register')) {
  const sw = `<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/mobile/sw.js').catch(function () {});
  });
}
</script>`;
  html = html.replace(/<\/body>/i, `${sw}\n</body>`);
}

fs.writeFileSync(indexPath, html);
console.log(`[inject-expo-pwa-html] patched ${indexPath}`);
