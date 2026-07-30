import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import analyzeHandler from './api/analyze.js';
import imageHandler from './api/generate-image.js';
import authHandler from './api/auth.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);

async function loadEnv(filename) {
  const filepath = path.join(root, filename);
  if (!existsSync(filepath)) return;
  const content = await readFile(filepath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}
await loadEnv('.env.local');
await loadEnv('.env');

const handlers = {
  '/api/auth': authHandler,
  '/api/analyze': analyzeHandler,
  '/api/generate-image': imageHandler,
};

const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  if (!chunks.length) return undefined;
  const text = Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(text); } catch { return text; }
}

function responseAdapter(res) {
  let statusCode = 200;
  return {
    status(code) { statusCode = code; return this; },
    setHeader(name, value) { res.setHeader(name, value); },
    json(payload) {
      if (res.writableEnded) return;
      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(payload));
    },
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (handlers[url.pathname]) {
      const request = { method: req.method, headers: req.headers, body: await parseBody(req) };
      await handlers[url.pathname](request, responseAdapter(res));
      return;
    }

    let relative = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
    if (!['index.html', 'app.js', 'styles.css'].includes(relative) && !relative.startsWith('shared/')) relative = 'index.html';
    const filepath = path.resolve(root, relative);
    if (!filepath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }
    const data = await readFile(filepath);
    res.statusCode = 200;
    res.setHeader('Content-Type', mime[path.extname(filepath)] || 'application/octet-stream');
    res.end(data);
  } catch (error) {
    console.error(error);
    if (!res.writableEnded) { res.statusCode = 500; res.end('Internal Server Error'); }
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Mestre do Tráfego disponível em http://localhost:${port}`);
  console.log(process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY carregada.' : 'AVISO: GEMINI_API_KEY não configurada.');
  console.log(process.env.APP_PASSWORD ? 'Acesso protegido por senha.' : 'Acesso local sem senha.');
});
