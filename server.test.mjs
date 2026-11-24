import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('restringe o projeto aos participantes e libera as avaliações após a conclusão', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'dico-test-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const dataFile = join(dir, 'dados.json');
  const base = await running(t, { dataFile });
  const call = (path, body, cookie) => fetch(base + '/api/dico/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...(cookie && { Cookie: cookie }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  async function register(nome, tipo) {
    const response = await call('cadastro', { nome, tipo, email: nome + '@example.com', senha: 'senha-teste' });
    assert.equal(response.status, 200);
    return { ...(await response.json()).conta, cookie: response.headers.get('set-cookie').split(';')[0] };
  }
  assert.equal((await call('conta')).status, 401);
  const client = await register('Cliente', 'cliente');
  const professional = await register('Pintor', 'profissional');
  const stranger = await register('Outro', 'cliente');
  assert.equal((await call('login', { email: 'Pintor@example.com', senha: 'senha-teste', tipo: 'cliente' })).status, 401);
  assert.equal((await call('login', { email: 'Pintor@example.com', senha: 'senha-teste', tipo: 'profissional' })).status, 200);
  const creation = await call('projetos', { obra: 'obra-1', nome: 'Reforma', profissional: professional.id }, client.cookie);
  assert.equal(creation.status, 201);
  const { id } = await creation.json();
  const change = (action, cookie, body = {}) => call(`projetos/${id}/${action}`, body, cookie);
  assert.equal((await change('aceitar', stranger.cookie)).status, 404);
  assert.equal((await change('aceitar', client.cookie)).status, 409);
  assert.equal((await change('finalizar', client.cookie)).status, 409);
  assert.equal((await change('aceitar', professional.cookie)).status, 200);
  assert.equal((await change('avaliar', client.cookie, { nota: 5 })).status, 409);
  assert.equal((await change('finalizar', professional.cookie)).status, 409);
  assert.equal((await change('finalizar', client.cookie)).status, 200);
  assert.equal((await change('avaliar', client.cookie, { nota: 9 })).status, 400);
  assert.equal((await change('avaliar', client.cookie, { nota: 5, comentario: 'Ótimo trabalho' })).status, 201);
  assert.equal((await change('avaliar', client.cookie, { nota: 4 })).status, 409);
  assert.equal((await change('avaliar', professional.cookie, { nota: 4 })).status, 201);
  const clientAccount = await (await call('conta', undefined, client.cookie)).json();
  assert.deepEqual(clientAccount.avaliacao, { media: 4, total: 1 });
  const directory = await (await call('profissionais')).json();
  assert.deepEqual(directory, [{ id: professional.id, nome: 'Pintor', tipo: 'profissional', avaliacao: { total: 1, media: 5 } }]);
  assert.equal((await fetch(base + '/.dico/dados.json')).status, 404);
  assert.equal((await call('sair', {}, client.cookie)).status, 200);
  assert.equal((await call('conta', undefined, client.cookie)).status, 401);

  const reloaded = await running(t, { dataFile });
  const restored = await fetch(reloaded + '/api/dico/conta', { headers: { Cookie: professional.cookie } });
  assert.equal(restored.status, 200);
  assert.deepEqual((await restored.json()).recebidas, [{ nome: 'Reforma', nota: 5, comentario: 'Ótimo trabalho' }]);
  for (const page of ['', 'conta.html', 'precos.html', 'calculadora.html']) {
    const response = await fetch(reloaded + '/' + page);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /src="vlibras\.js"/);
  }
  assert.equal((await fetch(reloaded + '/assets/dico_acenando.png')).status, 200);
});

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
