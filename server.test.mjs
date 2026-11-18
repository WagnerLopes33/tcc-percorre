import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer, normalize } from './server.js';

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
  const base = await running(t, { key: '', allowDemo: true });
  const first = await (await fetch(`${base}/api/precos?categoria=argamassa`)).json();
  assert.equal(first.demo, true);
  assert.equal(first.offers.length, 3);
  assert.equal(first.offers[0].link, null);
  const second = await (await fetch(`${base}/api/precos?categoria=argamassa`)).json();
  assert.equal(second.cached, true);
  assert.equal(second.updatedAt, first.updatedAt);
  assert.equal((await fetch(`${base}/.env`)).status, 404);
  assert.equal((await fetch(`${base}/server.js`)).status, 404);
});

test('provedor real recebe parâmetros e erros não expõem credenciais', async t => {
  const base = await running(t, { key: 'segredo', fetcher: async url => {
    const params = new URL(url).searchParams;
    assert.equal(params.get('gl'), 'br');
    assert.equal(params.get('engine'), 'google_shopping');
    assert.equal(params.get('api_key'), 'segredo');
    assert.equal(params.get('q'), 'Argamassa AC-II 20 kg');
    return { ok: true, json: async () => ({ error: 'segredo interno' }) };
  } });
  const response = await fetch(`${base}/api/precos?categoria=argamassa&detalhes=AC-II+20+kg`);
  assert.equal(response.status, 502);
  assert.ok(!(await response.text()).includes('segredo'));
});

test('ofertas preservam origem e são filtradas pela categoria e pelo tipo de produto', async t => {
  const offer = { title: 'Argamassa AC-II', source: 'Loja', extracted_price: 42, product_link: 'https://example.com' };
  const base = await running(t, { key: 'chave', fetcher: async () => ({
    ok: true,
    json: async () => ({ shopping_results: [
      offer,
      { ...offer, title: 'Rejunte flexível' },
      { ...offer, title: 'Removedor de argamassa' },
      { ...offer, title: 'Desempenadeira para argamassa' },
      { ...offer, title: 'Paracetamol' },
    ] }),
  }) });
  const data = await (await fetch(`${base}/api/precos?categoria=argamassa`)).json();
  assert.equal(data.demo, false);
  assert.equal(data.offers.length, 1);
  assert.equal(data.offers[0].price, 42);
  assert.equal(data.source, 'SerpApi / Google Shopping');
});

test('Express serve a interface e a API, com erro quando falta a chave em produção', async t => {
  const base = await running(t, { key: '', allowDemo: false });
  assert.equal((await fetch(base)).status, 200);
  assert.match(await (await fetch(base + '/precos.html')).text(), /search-prices/);
  const status = await (await fetch(base + '/api/status')).json();
  assert.equal(status.status, 'online');
  const response = await fetch(base + '/api/precos?categoria=argamassa');
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /SERPAPI_API_KEY/);
});

test('categorias e detalhes inválidos são rejeitados antes da consulta', async t => {
  let calls = 0;
  const base = await running(t, { key: 'chave', fetcher: async () => { calls++; } });
  const categories = await (await fetch(base + '/api/precos/categorias')).json();
  assert.deepEqual(categories.map(({ id }) => id), [
    'tinta', 'selador', 'massa', 'piso', 'azulejo', 'argamassa', 'rejunte', 'rodape', 'contrapiso',
  ]);
  for (const query of ['q=paracetamol', 'categoria=medicamento', 'categoria=constructor',
    'categoria=argamassa&detalhes=paracetamol', 'categoria=argamassa&detalhes=desempenadeira',
    'categoria=tinta&categoria=piso', 'categoria=tinta&detalhes=' + 'a'.repeat(81)]) {
    const response = await fetch(base + '/api/precos?' + query);
    assert.equal(response.status, 400, query);
  }
  assert.equal(calls, 0);
});
