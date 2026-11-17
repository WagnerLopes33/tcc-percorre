import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const files = new Set(['index.html', 'style.css', 'dados.js', 'script.js', 'calculadora.html', 'calculadora.css', 'calculadora.js', 'precos.html', 'precos.js']);
const types = { html: 'text/html', css: 'text/css', js: 'text/javascript' };
export function normalize(items) {
  const seen = new Set();
  return items.flatMap(item => {
    const price = item.extracted_price;
    const link = item.product_link || item.link;
    if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || item.second_hand_condition) return [];
    try { if (!['https:', 'http:'].includes(new URL(link).protocol)) return []; } catch { return []; }
    const id = `${item.source}|${item.title}|${price}`;
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ title: String(item.title || 'Produto'), store: String(item.source || 'Loja não informada'), price, link, delivery: String(item.delivery || 'Frete não informado') }];
  }).sort((a, b) => a.price - b.price);
}
export function createServer({ key = process.env.SERPAPI_API_KEY, fetcher = fetch } = {}) {
  const cache = new Map();
  let nextSearch = 0;
  return http.createServer(async (req, res) => {
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method !== 'GET') return json(405, { error: 'Método não permitido.' });
      if (url.pathname === '/api/precos') {
        const q = (url.searchParams.get('q') || '').trim();
        if (q.length < 5 || q.length > 160) return json(400, { error: 'Descreva o produto com 5 a 160 caracteres.' });
        const cached = cache.get(q);
        if (cached && cached.expires > Date.now()) return json(200, { ...cached.data, cached: true });
        if (Date.now() < nextSearch) return json(429, { error: 'Aguarde alguns segundos antes de pesquisar novamente.' });
        nextSearch = Date.now() + 3000;
        let offers;
        if (!key) {
          offers = [79.9, 99.9, 129.9].map((price, i) => ({ title: `${q} — exemplo fictício`, store: `Loja demonstrativa ${i + 1}`, price, link: null, delivery: 'Frete não incluído' }));
        } else {
          const params = new URLSearchParams({ engine: 'google_shopping', q, gl: 'br', hl: 'pt', google_domain: 'google.com.br', api_key: key });
          const response = await fetcher(`https://serpapi.com/search.json?${params}`, { signal: AbortSignal.timeout(20000) });
          if (!response.ok) return json(502, { error: 'Não foi possível consultar o fornecedor. Confira a chave e a cota da API no servidor.' });
          const data = await response.json();
          if (data.error) return json(502, { error: 'O fornecedor não concluiu a busca. Confira sua conta e tente novamente.' });
          offers = normalize(data.shopping_results || []).slice(0, 40);
        }
        const data = { demo: !key, source: key ? 'SerpApi / Google Shopping' : 'Demonstração local', updatedAt: new Date().toISOString(), offers };
        if (cache.size >= 100) cache.delete(cache.keys().next().value);
        cache.set(q, { data, expires: Date.now() + 30 * 60000 });
        return json(200, data);
      }
      const name = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      if (!files.has(name)) return json(404, { error: 'Página não encontrada.' });
      const content = await readFile(join(root, name));
      res.writeHead(200, { 'Content-Type': `${types[name.split('.').pop()]}; charset=utf-8`, 'X-Content-Type-Options': 'nosniff' });
      res.end(content);
    } catch { json(502, { error: 'A consulta falhou ou demorou demais. Tente novamente.' }); }
  });
}
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  // Carrega apenas as configurações da aplicação, preservando o ambiente existente.
  try {
    const env = await readFile(join(root, '.env'), 'utf8');
    for (const line of env.split(/\r?\n/)) {
      const match = line.match(/^\s*(SERPAPI_API_KEY|PORT)\s*=\s*(.*?)\s*$/);
      if (!match || process.env[match[1]] !== undefined) continue;
      let value = match[2];
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      else value = value.replace(/\s+#.*$/, '').trim();
      process.env[match[1]] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  createServer().listen(Number(process.env.PORT) || 3000, '127.0.0.1', () => console.log(`Obrinha: http://localhost:${Number(process.env.PORT) || 3000}`));
}
