import { readFile } from 'node:fs/promises';

const [versionText, serviceWorker] = await Promise.all([
  readFile(new URL('../dist/version.json', import.meta.url), 'utf8'),
  readFile(new URL('../dist/sw.js', import.meta.url), 'utf8'),
]);

const { version } = JSON.parse(versionText);
if (typeof version !== 'string' || version.length === 0) {
  throw new Error('dist/version.json no contiene una versión válida');
}

const expectedVersion = process.env.VITE_APP_VERSION ?? process.env.GITHUB_SHA;
if (expectedVersion && version !== expectedVersion) {
  throw new Error(`La versión generada (${version}) no coincide con ${expectedVersion}`);
}

const requiredFragments = [
  'tile\\.openstreetmap\\.org',
  'basemaps\\.cartocdn\\.com',
  'sqljs-wasm',
  'cleanupOutdatedCaches()',
  'self.skipWaiting()',
];

for (const fragment of requiredFragments) {
  if (!serviceWorker.includes(fragment)) {
    throw new Error(`El Service Worker no contiene la regla requerida: ${fragment}`);
  }
}

// version.json must always come from the network with a cache-busting query.
if (serviceWorker.includes('url:"version.json"')) {
  throw new Error('version.json no debe formar parte del precache');
}

console.log(`Artefacto PWA verificado para la versión ${version}`);
