import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const clientPath = join(root, 'dist-bundle', 'football-dasti.bundle.js');
const outDir = join(root, 'dist-bundle');
const outPath = join(outDir, 'football-dasti.edge.js');

const client = readFileSync(clientPath, 'utf8');
const clientLiteral = JSON.stringify(client);

/** Optional fallback static images for /img/* (legacy absolute paths) */
const imgDir = join(root, 'public', 'img');
const imageFiles = [
  'photo-f55265356-500.jpg',
  'photo-f55265356-960.jpg',
  'photo-f55265356-1280.jpg',
  'photo-f55265356.jpg',
];
const images = {};
for (const name of imageFiles) {
  const p = join(imgDir, name);
  if (existsSync(p)) {
    images[name] = readFileSync(p).toString('base64');
  }
}
const imagesLiteral = JSON.stringify(images);

const worker = `/**
 * Edge worker — Table Soccer / فوتبال‌دستی
 * Serves HTML + client JS, and /img/* banner assets.
 */
const CLIENT_JS = ${clientLiteral};
const IMAGES = ${imagesLiteral};

function pageHtml() {
  const safeJs = CLIENT_JS.replace(/<\\/script/gi, '<\\\\/script');
  return \`<!doctype html>
<html lang="fa" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#111111" />
    <title>فوتبال‌دستی</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400..700&family=Figtree:wght@400..600&family=Martian+Mono:wght@400..500&family=Vazirmatn:wght@300;400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>html,body,#root{width:100%;height:100%;margin:0;overflow:hidden;background:#111}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>\${safeJs}</script>
  </body>
</html>\`;
}

function corsHeaders(request) {
  const origin = (request && request.headers && request.headers.get && request.headers.get('Origin')) || '*';
  return {
    'access-control-allow-origin': origin === 'null' ? '*' : origin,
    'access-control-allow-methods': 'GET, HEAD, OPTIONS',
    'access-control-allow-headers': '*',
    vary: 'Origin',
  };
}

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...corsHeaders(request),
    },
  });
}

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function handleFetch(request) {
  if (!request || !request.url) {
    return json({ ok: false, error: 'bad_request' }, 400, request);
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/\\/+$/, '') || '/';

  if (path === '/health' || path === '/api/health') {
    return json({ ok: true, app: 'table-soccer', edge: true }, 200, request);
  }

  // Serve banner images for absolute /img/* paths
  if (path.startsWith('/img/')) {
    const name = path.slice('/img/'.length);
    const b64 = IMAGES[name];
    if (b64) {
      return new Response(b64ToBytes(b64), {
        status: 200,
        headers: {
          'content-type': 'image/jpeg',
          'cache-control': 'public, max-age=86400',
          ...corsHeaders(request),
        },
      });
    }
    return new Response('Not found', { status: 404, headers: corsHeaders(request) });
  }

  if (
    path.endsWith('.js') ||
    path === '/bundle.js' ||
    path === '/app.js' ||
    path === '/football-dasti.bundle.js'
  ) {
    return new Response(CLIENT_JS, {
      status: 200,
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'public, max-age=300',
        ...corsHeaders(request),
      },
    });
  }

  return new Response(pageHtml(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-cache',
      ...corsHeaders(request),
    },
  });
}

export default {
  async fetch(request, _env, _ctx) {
    try {
      return await handleFetch(request);
    } catch (err) {
      return json(
        { ok: false, error: String(err && err.message ? err.message : err) },
        500,
        request,
      );
    }
  },
};

export const fetch = handleFetch;

export async function onRequest(context) {
  return handleFetch(context.request);
}
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, worker);
console.log('wrote', outPath);
console.log('bytes', Buffer.byteLength(worker));
