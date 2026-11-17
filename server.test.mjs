import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, normalize } from './server.mjs';

test('normaliza ofertas, remove preços inválidos, usados, duplicados e links inseguros', () => {
  const offer = { title: 'Argamassa 20 kg', source: 'Loja', extracted_price: 30, product_link: 'https://example.com/item' };
  assert.deepEqual(normalize([
    offer, offer, { ...offer, extracted_price: 0 },
    { ...offer, extracted_price: 10, second_hand_condition: 'Usado' },
    { ...offer, product_link: 'javascript:alert(1)' },
    { ...offer, title: 'Outra marca', extracted_price: 20 }
  ]).map(item => item.price), [20, 30]);
});

async function running(t, options) {
  const server = createServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  return `http://127.0.0.1:${server.address().port}`;
}

test('modo demo explícito, cache e arquivos privados protegidos', async t => {
  const base = await running(t, { key: '' });
  const first = await (await fetch(`${base}/api/precos?q=argamassa`)).json();
  assert.equal(first.demo, true);
  assert.equal(first.offers.length, 3);
  assert.equal(first.offers[0].link, null);
  const second = await (await fetch(`${base}/api/precos?q=argamassa`)).json();
  assert.equal(second.cached, true);
  assert.equal(second.updatedAt, first.updatedAt);
  assert.equal((await fetch(`${base}/.env`)).status, 404);
  assert.equal((await fetch(`${base}/server.mjs`)).status, 404);
  assert.equal((await fetch(`${base}/api/precos?q=x`)).status, 400);
});

test('provedor real recebe parâmetros e erros não expõem credenciais', async t => {
  const base = await running(t, { key: 'segredo', fetcher: async url => {
    const params = new URL(url).searchParams;
    assert.equal(params.get('gl'), 'br');
    assert.equal(params.get('engine'), 'google_shopping');
    assert.equal(params.get('api_key'), 'segredo');
    return { ok: true, json: async () => ({ error: 'segredo interno' }) };
  } });
  const response = await fetch(`${base}/api/precos?q=argamassa`);
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('segredo'));
});

test('ofertas reais preservam origem e falhas não viram demonstração', async t => {
  const base = await running(t, { key: 'chave', fetcher: async () => ({ ok: true, json: async () => ({ shopping_results: [{ title: 'Material', source: 'Loja', extracted_price: 42, product_link: 'https://example.com' }] }) }) });
  const data = await (await fetch(`${base}/api/precos?q=material`)).json();
  assert.equal(data.demo, false);
  assert.equal(data.offers[0].price, 42);
  assert.equal(data.source, 'SerpApi / Google Shopping');
});
