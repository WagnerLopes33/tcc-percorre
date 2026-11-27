const { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');

const derive = promisify(scrypt);
const lifetime = 7 * 24 * 60 * 60 * 1000;
const digest = token => createHash('sha256').update(token).digest('hex');
const publicAccount = ({ id, nome, tipo }) => ({ id, nome, tipo });
const clean = value => typeof value === 'string' ? value.trim() : '';
const emailOf = value => clean(value).toLowerCase();

function validProfile({ regiao, servicos, whatsapp, sobre } = {}) {
  const phone = clean(whatsapp).replace(/\D/g, '');
  if (!clean(regiao) || clean(regiao).length > 100 ||
      !Array.isArray(servicos) || !servicos.length || servicos.length > 14 ||
      !servicos.every(item => typeof item === 'string' && /^[a-z_]{1,30}$/.test(item)) ||
      (clean(whatsapp) && !/^\d{10,11}$/.test(phone)) || clean(sobre).length > 200) return null;
  return { regiao: clean(regiao), servicos: [...new Set(servicos)], whatsapp: phone,
    ...(sobre !== undefined && { sobre: clean(sobre) }) };
}

const profileError = 'Informe uma região, pelo menos um serviço e, se desejar, um WhatsApp com DDD e uma descrição de até 200 caracteres.';

class AccountError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function mountAccounts(app, { read, change }) {
  const highlights = new Map(Object.entries(JSON.parse(process.env.DICO_DESTAQUES || '{}')));
  function fail(res, status, erro) { return res.status(status).json({ erro }); }
  async function setSession(res, account, register = false) {
    const token = randomBytes(32).toString('hex');
    const now = Date.now();
    await change(next => {
      if (register) {
        if (next.accounts.some(item => item.email === account.email)) {
          throw new AccountError(409, 'Este e-mail já está cadastrado.');
        }
        next.accounts.push(account);
      }
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
  function stats(data, id) {
    const reviews = data.reviews.filter(review => review.target === id);
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
    const { nome, tipo, email, senha, perfil } = req.body || {};
    const address = emailOf(email);
    if (!clean(nome) || clean(nome).length > 100 || !['cliente', 'profissional'].includes(tipo) ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) || address.length > 254 ||
        typeof senha !== 'string' || senha.length < 8 || senha.length > 128) {
      return fail(res, 400, 'Confira o nome, o e-mail e a senha de 8 a 128 caracteres.');
    }
    const profile = tipo === 'profissional' && perfil !== undefined;
    const parsedProfile = profile && perfil && validProfile(perfil);
    if (profile && !parsedProfile) return fail(res, 400, profileError);
    const salt = randomBytes(16).toString('hex');
    const hash = (await derive(senha, salt, 64)).toString('hex');
    const account = { id: randomUUID(), nome: clean(nome), tipo, email: address, salt, hash, ...(parsedProfile && { perfil: parsedProfile }) };
    await setSession(res, account, true);
  });
  app.post('/api/dico/login', async (req, res) => {
    const { email, senha, tipo } = req.body || {};
    if (typeof senha !== 'string' || senha.length > 128) return fail(res, 400, 'Confira os dados da conta.');
    const account = (await read()).accounts.find(item => item.email === emailOf(email) && item.tipo === tipo);
    const hash = await derive(senha, account?.salt || 'dico-login', 64);
    if (!account || !timingSafeEqual(hash, Buffer.from(account.hash, 'hex'))) return fail(res, 401, 'E-mail, senha ou perfil incorreto.');
    await setSession(res, account);
  });
  app.get('/api/dico/profissionais', async (req, res) => {
    const data = await read();
    res.json(data.accounts.filter(account => account.tipo === 'profissional').map(account => ({
      ...publicAccount(account), ...professionalProfile(account),
      avaliacao: stats(data, account.id), destaque: highlighted(account),
    })));
  });
  app.use('/api/dico', async (req, res, next) => {
    const hash = sessionHash(req);
    if (!hash) return fail(res, 401, 'Entre na sua conta para continuar.');
    const data = await read();
    const session = data.sessions.find(item => item.hash === hash && item.expires > Date.now());
    req.account = session && data.accounts.find(account => account.id === session.user);
    if (!req.account) return fail(res, 401, 'Entre na sua conta para continuar.');
    req.accountData = data;
    next();
  });
  app.get('/api/dico/conta', (req, res) => {
    const id = req.account.id;
    const data = req.accountData;
    const recebidas = data.reviews.filter(review => review.target === id).map(review => ({
      nome: data.projects.find(project => project.id === review.project).nome,
      nota: review.nota,
      comentario: review.comentario,
    }));
    const profile = req.account.tipo === 'profissional' ? {
      perfil: professionalProfile(req.account),
      destaque: highlighted(req.account),
      destaqueAte: highlighted(req.account) ? highlights.get(req.account.email) : null,
    } : {};
    res.json({ conta: publicAccount(req.account), avaliacao: stats(data, id), recebidas, ...profile });
  });
  app.post('/api/dico/perfil-profissional', async (req, res) => {
    if (req.account.tipo !== 'profissional') return fail(res, 403, 'Esta opção é exclusiva para profissionais.');
    const perfil = validProfile(req.body || {});
    if (!perfil) return fail(res, 400, profileError);
    await change(next => {
      const account = next.accounts.find(item => item.id === req.account.id);
      account.perfil = { ...account.perfil, ...perfil };
    });
    res.json({ perfil });
  });
  app.post('/api/dico/sair', async (req, res) => {
    await change(next => { next.sessions = next.sessions.filter(item => item.hash !== sessionHash(req)); });
    res.clearCookie('dico_session', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({});
  });
  app.get('/api/dico/projetos', (req, res) => {
    const { id } = req.account;
    const data = req.accountData;
    res.json(data.projects.filter(project => [project.cliente, project.profissional].includes(id)).map(project => {
      const other = data.accounts.find(account => account.id === (project.cliente === id ? project.profissional : project.cliente));
      return {
        id: project.id, nome: project.nome, estado: project.estado,
        participante: publicAccount(other), avaliacao: stats(data, other.id),
        enviada: data.reviews.find(review => review.project === project.id && review.author === id)?.nota ?? null,
      };
    }));
  });
  app.post('/api/dico/projetos', async (req, res) => {
    if (req.account.tipo !== 'cliente') return fail(res, 403, 'Somente clientes podem vincular um profissional.');
    const { profissional, nome, obra } = req.body || {};
    if (!clean(nome) || clean(nome).length > 120 || !clean(obra) || clean(obra).length > 100 ||
        !req.accountData.accounts.some(account => account.id === profissional && account.tipo === 'profissional')) {
      return fail(res, 400, 'Escolha uma obra e um profissional com conta no Dico.');
    }
    const project = { id: randomUUID(), obra, nome: clean(nome), cliente: req.account.id, profissional, estado: 'pendente' };
    await change(next => {
      if (next.projects.some(item => item.cliente === project.cliente && item.obra === obra && item.profissional === profissional)) {
        throw new AccountError(409, 'Este profissional já foi convidado para esta obra.');
      }
      next.projects.push(project);
    });
    res.status(201).json({ id: project.id });
  });
  app.post('/api/dico/projetos/:id/:acao', async (req, res) => {
    const user = req.account.id;
    const status = await change(next => {
      const project = next.projects.find(item => item.id === req.params.id && [item.cliente, item.profissional].includes(user));
      if (!project) throw new AccountError(404, 'Projeto não encontrado.');
      const { acao } = req.params;
      const states = { aceitar: 'andamento', recusar: 'recusado', finalizar: 'finalizado' };
      const allowed = (acao === 'aceitar' || acao === 'recusar') && user === project.profissional && project.estado === 'pendente'
        || acao === 'finalizar' && user === project.cliente && project.estado === 'andamento';
      if (allowed) {
        project.estado = states[acao];
        return 200;
      }
      if (acao !== 'avaliar' || project.estado !== 'finalizado') {
        throw new AccountError(409, 'Esta ação não está disponível para o projeto.');
      }
      const { nota, comentario } = req.body || {};
      if (!Number.isInteger(nota) || nota < 1 || nota > 5 || clean(comentario).length > 500) {
        throw new AccountError(400, 'Informe uma nota de 1 a 5 e até 500 caracteres.');
      }
      if (next.reviews.some(item => item.project === project.id && item.author === user)) {
        throw new AccountError(409, 'Você já avaliou este projeto.');
      }
      const target = project.cliente === user ? project.profissional : project.cliente;
      next.reviews.push({ project: project.id, author: user, target, nota, comentario: clean(comentario) });
      return 201;
    });
    res.status(status).json({});
  });
  app.use('/api/dico', (error, req, res, next) => {
    if (error instanceof AccountError) return fail(res, error.status, error.message);
    next(error);
  });
}

module.exports = { mountAccounts };
