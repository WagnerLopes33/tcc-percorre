const { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { mkdirSync, readFileSync, writeFileSync, renameSync } = require('node:fs');
const { dirname, join } = require('node:path');
const { promisify } = require('node:util');

const derive = promisify(scrypt);
const lifetime = 7 * 24 * 60 * 60 * 1000;
const digest = token => createHash('sha256').update(token).digest('hex');
const publicAccount = ({ id, nome, tipo }) => ({ id, nome, tipo });
const clean = value => typeof value === 'string' ? value.trim() : '';
const emailOf = value => clean(value).toLowerCase();

function mountAccounts(app, file = process.env.DICO_DATA_FILE || join(__dirname, '.dico', 'dados.json')) {
  const highlights = new Map(Object.entries(JSON.parse(process.env.DICO_DESTAQUES || '{}')));
  let data;
  function read() {
    if (data) return data;
    try { data = JSON.parse(readFileSync(file, 'utf8')); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      data = { accounts: [], projects: [], reviews: [], sessions: [] };
    }
    return data;
  }
  function change(update) {
    const next = structuredClone(read());
    update(next);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file + '.tmp', JSON.stringify(next), { mode: 0o600 });
    renameSync(file + '.tmp', file);
    data = next;
  }
  function fail(res, status, erro) { return res.status(status).json({ erro }); }
  function setSession(res, account) {
    const token = randomBytes(32).toString('hex');
    const now = Date.now();
    change(next => {
      next.sessions = next.sessions.filter(session => session.expires > now);
      next.sessions.push({ hash: digest(token), user: account.id, expires: now + lifetime });
    });
    res.cookie('dico_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: lifetime });
    res.json({ conta: publicAccount(account) });
  }
  const sessionHash = req => {
    const token = req.headers.cookie?.match(/(?:^|;\s*)dico_session=([a-f0-9]{64})(?:;|$)/)?.[1];
    return token && digest(token);
  };
  function stats(id) {
    const reviews = read().reviews.filter(review => review.target === id);
    return { total: reviews.length, media: reviews.length ? reviews.reduce((sum, review) => sum + review.nota, 0) / reviews.length : null };
  }
  function professionalProfile(account) {
    return { regiao: '', servicos: [], whatsapp: '', ...account.perfil };
  }
  function highlighted(account) {
    const expires = highlights.get(account.email);
    return typeof expires === 'string' && Date.parse(expires) > Date.now();
  }
  app.use('/api/dico', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (req.method === 'POST' && !req.is('application/json')) return fail(res, 415, 'Envie os dados em JSON.');
    next();
  });
  app.post('/api/dico/cadastro', async (req, res) => {
    const { nome, tipo, email, senha } = req.body || {};
    const address = emailOf(email);
    if (!clean(nome) || clean(nome).length > 100 || !['cliente', 'profissional'].includes(tipo) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254 ||
        typeof senha !== 'string' || senha.length < 8 || senha.length > 128) {
      return fail(res, 400, 'Confira o nome, o e-mail e a senha de 8 a 128 caracteres.');
    }
    const salt = randomBytes(16).toString('hex');
    const hash = (await derive(senha, salt, 64)).toString('hex');
    if (read().accounts.some(account => account.email === address)) return fail(res, 409, 'Este e-mail já está cadastrado.');
    const account = { id: randomUUID(), nome: clean(nome), tipo, email: address, salt, hash };
    change(next => next.accounts.push(account));
    setSession(res, account);
  });
  app.post('/api/dico/login', async (req, res) => {
    const { email, senha, tipo } = req.body || {};
    if (typeof senha !== 'string' || senha.length > 128) return fail(res, 400, 'Confira os dados da conta.');
    const account = read().accounts.find(item => item.email === emailOf(email) && item.tipo === tipo);
    const hash = await derive(senha, account?.salt || 'dico-login', 64);
    if (!account || !timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) return fail(res, 401, 'E-mail, senha ou perfil incorreto.');
    setSession(res, account);
  });
  app.get('/api/dico/profissionais', (req, res) => {
    res.json(read().accounts.filter(account => account.tipo === 'profissional').map(account => ({
      ...publicAccount(account), ...professionalProfile(account),
      avaliacao: stats(account.id), destaque: highlighted(account),
    })));
  });
  app.use('/api/dico', (req, res, next) => {
    const hash = sessionHash(req);
    const session = hash && read().sessions.find(item => item.hash === hash && item.expires > Date.now());
    req.account = session && read().accounts.find(account => account.id === session.user);
    if (!req.account) return fail(res, 401, 'Entre na sua conta para continuar.');
    next();
  });
  app.get('/api/dico/conta', (req, res) => {
    const id = req.account.id;
    const recebidas = read().reviews.filter(review => review.target === id).map(review => ({
      nome: read().projects.find(project => project.id === review.project).nome,
      nota: review.nota,
      comentario: review.comentario,
    }));
    const profile = req.account.tipo === 'profissional' ? {
      perfil: professionalProfile(req.account),
      destaque: highlighted(req.account),
    } : {};
    res.json({ conta: publicAccount(req.account), avaliacao: stats(id), recebidas, ...profile });
  });
  app.post('/api/dico/perfil-profissional', (req, res) => {
    if (req.account.tipo !== 'profissional') return fail(res, 403, 'Esta opção é exclusiva para profissionais.');
    const { regiao, servicos, whatsapp } = req.body || {};
    const phone = clean(whatsapp).replace(/\D/g, '');
    if (!clean(regiao) || clean(regiao).length > 100 ||
        !Array.isArray(servicos) || !servicos.length || servicos.length > 14 ||
        !servicos.every(item => typeof item === 'string' && /^[a-z_]{1,30}$/.test(item)) ||
        (clean(whatsapp) && !/^\d{10,11}$/.test(phone))) {
      return fail(res, 400, 'Informe uma região, pelo menos um serviço e, se desejar, um WhatsApp com DDD.');
    }
    const perfil = { regiao: clean(regiao), servicos: [...new Set(servicos)], whatsapp: phone };
    change(next => { next.accounts.find(account => account.id === req.account.id).perfil = perfil; });
    res.json({ perfil });
  });
  app.post('/api/dico/sair', (req, res) => {
    change(next => { next.sessions = next.sessions.filter(item => item.hash !== sessionHash(req)); });
    res.clearCookie('dico_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({});
  });
  app.get('/api/dico/projetos', (req, res) => {
    const { id } = req.account;
    res.json(read().projects.filter(project => [project.cliente, project.profissional].includes(id)).map(project => {
      const other = read().accounts.find(account => account.id === (project.cliente === id ? project.profissional : project.cliente));
      return {
        id: project.id, nome: project.nome, estado: project.estado,
        participante: publicAccount(other), avaliacao: stats(other.id),
        enviada: read().reviews.find(review => review.project === project.id && review.author === id)?.nota ?? null,
      };
    }));
  });
  app.post('/api/dico/projetos', (req, res) => {
    if (req.account.tipo !== 'cliente') return fail(res, 403, 'Somente clientes podem vincular um profissional.');
    const { profissional, nome, obra } = req.body || {};
    if (!clean(nome) || clean(nome).length > 120 || !clean(obra) || clean(obra).length > 100 ||
        !read().accounts.some(account => account.id === profissional && account.tipo === 'profissional')) {
      return fail(res, 400, 'Escolha uma obra e um profissional com conta no Dico.');
    }
    if (read().projects.some(project => project.cliente === req.account.id && project.obra === obra && project.profissional === profissional)) {
      return fail(res, 409, 'Este profissional já foi convidado para esta obra.');
    }
    const project = { id: randomUUID(), obra, nome: clean(nome), cliente: req.account.id, profissional, estado: 'pendente' };
    change(next => next.projects.push(project));
    res.status(201).json({ id: project.id });
  });
  app.post('/api/dico/projetos/:id/:acao', (req, res) => {
    const user = req.account.id;
    const project = read().projects.find(item => item.id === req.params.id && [item.cliente, item.profissional].includes(user));
    if (!project) return fail(res, 404, 'Projeto não encontrado.');
    const { acao } = req.params;
    const states = { aceitar: 'andamento', recusar: 'recusado', finalizar: 'finalizado' };
    const allowed = (acao === 'aceitar' || acao === 'recusar') && user === project.profissional && project.estado === 'pendente'
      || acao === 'finalizar' && user === project.cliente && project.estado === 'andamento';
    if (allowed) {
      change(next => { next.projects.find(item => item.id === project.id).estado = states[acao]; });
      return res.json({});
    }
    if (acao !== 'avaliar' || project.estado !== 'finalizado') return fail(res, 409, 'Esta ação não está disponível para o projeto.');
    const { nota, comentario } = req.body || {};
    if (!Number.isInteger(nota) || nota < 1 || nota > 5 || clean(comentario).length > 500) return fail(res, 400, 'Informe uma nota de 1 a 5 e até 500 caracteres.');
    if (read().reviews.some(item => item.project === project.id && item.author === user)) return fail(res, 409, 'Você já avaliou este projeto.');
    const target = project.cliente === user ? project.profissional : project.cliente;
    change(next => next.reviews.push({ project: project.id, author: user, target, nota, comentario: clean(comentario) }));
    res.status(201).json({});
  });
}

module.exports = { mountAccounts };
