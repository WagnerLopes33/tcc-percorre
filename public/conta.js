const $ = selector => document.querySelector(selector);
const authForm = $('#auth-form');
const invite = $('#invite');
const professionalProfile = $('#professional-profile');
const projectForm = $('#project-form');
const dialog = $('#project-dialog');
const status = $('#account-status');
const params = new URLSearchParams(location.search);
let mode = 'login';
let signupStep = 1;
let selectedAction;
let account;
let currentProfessionalProfile;

async function api(path, body) {
    let response;
    try {
        response = await fetch('/api/dico/' + path, body === undefined ? {} : {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
    } catch {
        throw new Error('Não foi possível acessar o servidor do Dico. No ambiente local, execute npm start e acesse http://localhost:3000.');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
        const message = response.status === 404 || response.status === 405 || (response.ok && !data)
            ? 'A API do Dico não está disponível neste endereço. No ambiente local, execute npm start e acesse http://localhost:3000.'
            : 'Não foi possível concluir a operação no servidor. Tente novamente.';
        throw Object.assign(new Error(data?.erro || message), { status: response.status });
    }
    return data;
}

const authArt = {
    cliente: ['Para quem vai reformar', 'Sua obra organizada, do cálculo à compra', 'dico_acenando.png',
        ['Lista de materiais na medida', 'Gastos e alerta de orçamento', 'Convites a profissionais para sua obra']],
    profissional: ['Para profissionais', 'Clientes certos para o seu serviço', 'dico_construindo_anterior.png',
        ['Cadastro e perfil grátis', 'Convites de clientes para suas obras', 'Avaliações após concluir o serviço']],
};

function authError(message = '', field) {
    const error = $('#auth-error');
    error.textContent = message;
    error.hidden = !message;
    authForm.querySelectorAll('[aria-invalid="true"]').forEach(input => input.removeAttribute('aria-invalid'));
    if (field) {
        field.setAttribute('aria-invalid', 'true');
        field.focus();
    }
}

function signupProfile() {
    return {
        regiao: authForm.elements.regiao.value.trim(),
        whatsapp: authForm.elements.telefone.value.trim(),
        servicos: [...authForm.querySelectorAll('[name="signup-service"]:checked')].map(input => input.value),
        sobre: authForm.elements.sobre.value.trim(),
    };
}

function showSignupPreview() {
    const profile = signupProfile();
    const services = SERVICOS_BUSCA.filter(([id]) => profile.servicos.includes(id)).map(([, name]) => name);
    const card = $('#signup-card');
    card.replaceChildren(element('h2', authForm.elements.nome.value.trim()),
        element('p', 'Novo no Dico', 'eyebrow'), element('p', profile.regiao, 'muted'));
    const tags = element('div', '', 'tag-row');
    tags.append(...services.map(name => element('span', name, 'tag')));
    card.append(tags);
    if (profile.sobre) card.append(element('p', profile.sobre));
    if (profile.whatsapp) card.append(element('p', 'WhatsApp: ' + profile.whatsapp, 'muted'));
}

function renderAuth() {
    const register = mode === 'cadastro';
    const fields = authForm.elements;
    const pro = fields.tipo.value === 'profissional';
    const wizard = register && pro;
    const step = wizard ? signupStep : 1;
    const [label, title, mascot, benefits] = authArt[fields.tipo.value];
    $('#auth-art-label').textContent = label;
    $('#auth-art-title').textContent = title;
    $('#auth-mascot').src = 'assets/' + mascot;
    $('#auth-benefits').replaceChildren(...benefits.map(text => element('li', text)));
    const headings = !register
        ? ['Entrar', pro ? 'Acesse seu painel e veja os pedidos de orçamento.' : 'Acesse suas obras e seus gastos.', 'Entrar']
        : !pro ? ['Criar conta', 'Grátis. Salve suas obras e peça orçamentos.', 'Criar conta']
        : [
            ['Cadastro de profissional', 'Grátis. Leva 2 minutos.', 'Continuar'],
            ['Seu perfil profissional', 'É assim que os clientes vão encontrar você.', 'Continuar'],
            ['Confira e publique', 'Seu perfil vai aparecer assim para quem reforma.', 'Publicar meu perfil'],
        ][step - 1];
    $('#auth-title').textContent = headings[0];
    $('#auth-description').textContent = headings[1];
    $('#auth-submit').textContent = headings[2];
    authForm.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', button.dataset.mode === mode));
    const steps = $('#auth-steps');
    steps.hidden = !wizard;
    [...steps.children].forEach((item, index) => {
        item.classList.toggle('ok', index + 1 < step);
        if (index + 1 === step) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
    });
    for (const [id, active] of [['auth-credentials', step === 1], ['signup-profile', step === 2]]) {
        const section = $('#' + id);
        section.hidden = !active;
        section.disabled = !active;
    }
    $('#name-field').hidden = !register;
    $('#name-label').textContent = pro ? 'Nome profissional' : 'Seu nome';
    fields.nome.placeholder = pro ? 'Ex.: João Pinturas' : 'Ex.: Carla Souza';
    fields.nome.disabled = !register;
    fields.nome.required = register;
    fields.senha.autocomplete = register ? 'new-password' : 'current-password';
    fields.senha.minLength = register ? 8 : 0;
    fields.senha.placeholder = register ? 'Mínimo de 8 caracteres' : 'Sua senha';
    const notice = register && (!pro || step === 3);
    $('#signup-notice').hidden = !notice;
    fields.ciente.disabled = !notice;
    fields.ciente.required = notice;
    $('#signup-notice-text').textContent = pro ? 'Região, serviços e os dados opcionais do perfil serão públicos na rede de profissionais.'
        : 'As obras e os gastos ficam neste navegador. Contas, convites e avaliações são salvos no servidor.';
    $('#signup-preview').hidden = step !== 3;
    if (step === 3) showSignupPreview();
    $('#auth-back').hidden = step === 1;
    $('#auth-actions').classList.toggle('with-back', step > 1);
    $('#auth-switch').hidden = step > 1;
    $('#auth-switch-text').textContent = register ? 'Já tem conta?' : 'Ainda não tem conta?';
    $('#auth-switch-button').textContent = register ? 'Entrar' : 'Criar conta grátis';
    authError();
}

function setMode(value) {
    mode = value;
    signupStep = 1;
    authForm.elements.senha.value = '';
    authForm.elements.ciente.checked = false;
    status.textContent = '';
    renderAuth();
}

function setAuthChrome(active) {
    $('#auth-header').hidden = !active;
    const prototypeFooter = active || account?.tipo === 'profissional';
    $('#auth-footer').hidden = !prototypeFooter;
    $('#dashboard-header').hidden = active;
    $('#dashboard-footer').hidden = prototypeFooter;
}

function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
}

function rating({ total, media }) {
    return total ? `★ ${media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} de 5 · ${total} ${total === 1 ? 'avaliação' : 'avaliações'}` : 'Sem avaliações';
}

function localWorks() {
    try {
        const works = JSON.parse(localStorage.getItem('obrinha:v2'))?.obras;
        return Array.isArray(works) ? works.filter(work => work?.id && work.nome && work.id !== 'obra-exemplo') : [];
    } catch {
        return [];
    }
}

function renderInvite(professionals) {
    const works = localWorks();
    const workSelect = invite.elements.obra;
    const professionalSelect = invite.elements.profissional;
    workSelect.replaceChildren(new Option('Selecione a obra', ''), ...works.map(work => new Option(work.nome, work.id)));
    professionalSelect.replaceChildren(new Option('Selecione o profissional', ''), ...professionals.map(pro => new Option(`${pro.nome} · ${rating(pro.avaliacao)}`, pro.id)));
    if (works.some(work => work.id === params.get('obra'))) workSelect.value = params.get('obra');
    if (professionals.some(pro => pro.id === params.get('profissional'))) professionalSelect.value = params.get('profissional');
    invite.querySelector('button').disabled = !works.length || !professionals.length;
    $('#invite-help').textContent = !works.length ? 'Crie uma obra na página inicial para enviar um convite.'
        : !professionals.length ? 'O profissional precisa criar uma conta para receber o convite.'
        : 'O profissional poderá aceitar o convite no próprio painel.';
}

const actions = {
    aceitar: ['Aceitar convite', 'O cliente poderá finalizar o projeto após o serviço.'],
    recusar: ['Recusar convite', 'O convite ficará marcado como recusado.'],
    finalizar: ['Finalizar projeto', 'Confirme quando o serviço deste profissional estiver concluído. Depois, os dois poderão se avaliar.'],
    avaliar: ['Avaliar', 'Dê uma nota de 1 a 5. A pessoa avaliada poderá ler seu comentário.'],
};

function actionButton(project, action) {
    const button = element('button', actions[action][0], action === 'recusar' ? 'btn btn-sec' : 'btn btn-primary');
    button.type = 'button';
    button.onclick = () => {
        selectedAction = { id: project.id, action };
        projectForm.reset();
        $('#dialog-title').textContent = action === 'avaliar' ? `Avaliar ${project.participante.nome}` : actions[action][0];
        $('#dialog-description').textContent = actions[action][1];
        $('#review-fields').hidden = action !== 'avaliar';
        projectForm.elements.nota.required = action === 'avaliar';
        $('#dialog-submit').textContent = action === 'avaliar' ? 'Enviar avaliação' : 'Confirmar';
        $('#dialog-status').textContent = '';
        dialog.showModal();
    };
    return button;
}

function renderProjects(projects, list = $('#projects')) {
    const professional = account.tipo === 'profissional';
    const labels = { pendente: 'Aguardando aceite', recusado: 'Convite recusado', andamento: 'Em andamento', finalizado: 'Finalizado' };
    const badges = { pendente: 'b-or', recusado: 'b-neu', andamento: 'b-neu', finalizado: 'b-ok' };
    for (const [suffix, state] of [[professional ? 'new' : 'pending', 'pendente'], ['active', 'andamento'], ['finished', 'finalizado']]) {
        $(`#${professional ? '' : 'client-'}kpi-${suffix}`).textContent = projects.filter(project => project.estado === state).length;
    }
    list.replaceChildren();
    if (!projects.length) {
        const empty = element('div', '', 'empty');
        const mascot = document.createElement('img');
        mascot.src = 'assets/dico_pensativo.png';
        mascot.alt = '';
        mascot.width = 90;
        empty.append(mascot, element('h3', professional ? 'Nenhum pedido ainda' : 'Nenhum projeto vinculado ainda'),
            element('p', professional ? 'Os convites enviados por clientes aparecem aqui.' : 'Vincule um profissional a uma obra para acompanhar o projeto aqui.', 'muted'));
        list.append(empty);
    }
    for (const project of projects) {
        const card = element('article', '', 'professional-request');
        card.classList.toggle('new-request', project.estado === 'pendente');
        const header = element('div', '', 'row between');
        const identity = element('div', '');
        identity.append(element('h3', professional ? project.participante.nome : project.nome),
            element('p', professional ? project.nome : project.participante.nome, 'muted small'));
        header.append(identity, element('span', labels[project.estado], 'badge ' + badges[project.estado]));
        card.append(header, element('p', rating(project.avaliacao) + (professional ? ' como cliente' : ''), 'muted small'));
        if (project.estado === 'pendente' && professional) {
            const controls = element('div', '', 'row');
            controls.append(actionButton(project, 'aceitar'), actionButton(project, 'recusar'));
            card.append(controls);
        }
        if (project.estado === 'andamento' && account.tipo === 'cliente') card.append(actionButton(project, 'finalizar'));
        if (project.estado === 'finalizado') {
            card.append(project.enviada === null ? actionButton(project, 'avaliar')
                : element('p', `Avaliação enviada · ${project.enviada} de 5`, 'muted'));
        }
        list.append(card);
    }
}

function renderProfessionalProfile(perfil) {
    professionalProfile.elements.regiao.value = perfil.regiao;
    professionalProfile.elements.whatsapp.value = perfil.whatsapp;
    professionalProfile.elements.sobre.value = perfil.sobre || '';
    $('#profile-services').replaceChildren(...SERVICOS_BUSCA.map(([id, name]) => {
        const label = element('label', '', 'chk');
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.name = 'servicos';
        input.value = id;
        input.checked = perfil.servicos.includes(id);
        label.append(input, element('span', name));
        return label;
    }));
}

function renderProfessionalPreview(perfil, avaliacao) {
    const preview = $('#professional-preview');
    const services = SERVICOS_BUSCA.filter(([id]) => perfil.servicos.includes(id));
    const identity = element('div', '', 'row');
    const initial = Array.from(account.nome)[0].toLocaleUpperCase('pt-BR');
    const details = element('div', '');
    details.append(element('h3', account.nome), element('p', rating(avaliacao), 'muted small'));
    identity.append(element('span', initial, 'avatar'), details);
    const tags = element('div', '', 'tag-row');
    tags.append(...services.map(([, name]) => element('span', name, 'tag')));
    preview.replaceChildren(identity, element('p', perfil.regiao || 'Região não informada', 'muted small'), tags);
    if (perfil.sobre) preview.append(element('p', perfil.sobre, 'small'));
}

function renderDashboardRating(prefix, avaliacao) {
    $(`#${prefix}kpi-rating`).textContent = avaliacao.total ? avaliacao.media.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' ★' : '—';
    $(`#${prefix}kpi-reviews`).textContent = avaliacao.total ? avaliacao.total + (avaliacao.total === 1 ? ' avaliação' : ' avaliações') : 'Sem avaliações ainda';
}

function renderProfessionalDashboard({ conta, avaliacao, recebidas, perfil, destaque, destaqueAte }, projects) {
    $('#professional-title').textContent = 'Olá, ' + conta.nome.split(/\s+/)[0];
    const visibility = $('#professional-visibility');
    visibility.className = 'badge ' + (destaque ? 'b-or' : 'b-ok');
    visibility.textContent = destaque ? '★ Destaque ativo' : 'Perfil visível para clientes';
    renderDashboardRating('', avaliacao);
    $('#professional-highlight').classList.toggle('active', destaque);
    $('#professional-highlight-title').textContent = destaque ? 'Você está no topo da sua região' : 'Apareça primeiro para quem reforma';
    $('#professional-highlight-expiry').textContent = destaqueAte ? 'Ativo até ' + new Date(destaqueAte).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '';
    currentProfessionalProfile = perfil;
    renderProfessionalPreview(perfil, avaliacao);
    renderProjects([...projects].sort((a, b) => Number(b.estado === 'pendente') - Number(a.estado === 'pendente')), $('#professional-requests'));
    $('#professional-reviews').hidden = !recebidas.length;
    $('#professional-review-list').replaceChildren(...recebidas.map(review =>
        element('p', `${review.nome} · ${review.nota} de 5${review.comentario ? ' · ' + review.comentario : ''}`, 'review-detail')));
}

async function showDashboard(data) {
    const { conta, avaliacao, recebidas } = data;
    const client = conta.tipo === 'cliente';
    const [projects, professionals] = await Promise.all([api('projetos'), client ? api('profissionais') : []]);
    account = conta;
    $('#auth').hidden = true;
    setAuthChrome(false);
    $('#dashboard').hidden = false;
    $('#client-dashboard').hidden = !client;
    $('#professional-dashboard').hidden = client;
    $('#client-home-link').hidden = !client;
    $('#professional-panel-link').hidden = client;
    if (!client) {
        renderProfessionalDashboard(data, projects);
        return;
    }
    $('#dashboard-title').textContent = 'Olá, ' + conta.nome.split(/\s+/)[0];
    renderDashboardRating('client-', avaliacao);
    $('#reputation').hidden = !recebidas.length;
    $('#client-review-list').replaceChildren(...recebidas.map(review =>
        element('p', `${review.nome} · ${review.nota} de 5${review.comentario ? ' · ' + review.comentario : ''}`, 'review-detail')));
    invite.hidden = false;
    renderProjects(projects);
    renderInvite(professionals);
}

function showAuth() {
    account = undefined;
    $('#dashboard').hidden = true;
    $('#auth').hidden = false;
    setAuthChrome(true);
}

function bindForm(form, message, handler) {
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const button = event.submitter || form.querySelector('button:not([type])');
        if (button.disabled) return;
        button.disabled = true;
        message.textContent = '';
        try { await handler(Object.fromEntries(new FormData(form))); }
        catch (error) { message.textContent = error.message; }
        finally { button.disabled = false; }
    });
}

authForm.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => setMode(button.dataset.mode));
$('#auth-switch-button').onclick = () => {
    setMode(mode === 'login' ? 'cadastro' : 'login');
    $('#auth-title').focus();
};
authForm.querySelectorAll('[name="tipo"]').forEach(input => input.onchange = () => {
    authForm.elements.ciente.checked = false;
    renderAuth();
});
$('#auth-back').onclick = () => {
    signupStep--;
    authForm.elements.ciente.checked = false;
    renderAuth();
    $('#auth-title').focus();
};
for (const [id, name] of SERVICOS_BUSCA) {
    const label = element('label', '', 'chk');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = 'signup-service';
    input.value = id;
    label.append(input, element('span', name));
    $('#signup-services').append(label);
}
bindForm(professionalProfile, $('#profile-status'), async ({ regiao, whatsapp, sobre }) => {
    const servicos = new FormData(professionalProfile).getAll('servicos');
    if (!servicos.length) throw new Error('Selecione pelo menos um serviço.');
    await api('perfil-profissional', { regiao, servicos, whatsapp, sobre });
    $('#profile-dialog').close();
    status.textContent = 'Perfil atualizado.';
    await showDashboard(await api('conta'));
});
$('#edit-professional').onclick = () => {
    renderProfessionalProfile(currentProfessionalProfile);
    $('#profile-status').textContent = '';
    $('#profile-dialog').showModal();
};
$('#cancel-professional-edit').onclick = () => $('#profile-dialog').close();
$('#highlight-details').onclick = () => $('#highlight-dialog').showModal();
authForm.addEventListener('submit', async event => {
    event.preventDefault();
    const button = $('#auth-submit');
    if (button.disabled) return;
    const fields = authForm.elements;
    const register = mode === 'cadastro';
    const wizard = register && fields.tipo.value === 'profissional';
    authError();
    if (!wizard || signupStep === 1) {
        if (register && !fields.nome.value.trim()) return authError('Informe seu nome.', fields.nome);
        if (!fields.email.validity.valid) return authError('Informe um e-mail válido.', fields.email);
        if (register && fields.senha.value.length < 8) return authError('Escolha uma senha com pelo menos 8 caracteres.', fields.senha);
        if (!fields.senha.value) return authError('Informe sua senha.', fields.senha);
    }
    if (wizard && signupStep === 2) {
        const profile = signupProfile();
        if (!profile.regiao) return authError('Informe sua região de atendimento.', fields.regiao);
        if (!profile.servicos.length) return authError('Selecione pelo menos um serviço.', authForm.querySelector('[name="signup-service"]'));
        if (profile.whatsapp && !/^\d{10,11}$/.test(profile.whatsapp.replace(/\D/g, ''))) return authError('Informe um WhatsApp com DDD ou deixe o campo em branco.', fields.telefone);
    }
    if (wizard && signupStep < 3) {
        signupStep++;
        renderAuth();
        $('#auth-title').focus();
        return;
    }
    if (register && !fields.ciente.checked) return authError('Marque a caixa de confirmação para continuar.', fields.ciente);
    button.disabled = true;
    $('#auth-back').disabled = true;
    authForm.querySelectorAll('[data-mode], [name="tipo"]').forEach(input => input.disabled = true);
    $('#auth-switch-button').disabled = true;
    try {
        await api(mode, { tipo: fields.tipo.value, email: fields.email.value, senha: fields.senha.value,
            ...(mode === 'cadastro' && { nome: fields.nome.value }),
            ...(wizard && { perfil: signupProfile() }),
        });
        fields.senha.value = '';
        await showDashboard(await api('conta'));
        const heading = account.tipo === 'profissional' ? $('#professional-title') : $('#dashboard-title');
        heading.tabIndex = -1;
        heading.focus();
    } catch (error) {
        if (wizard && error.status === 409) {
            signupStep = 1;
            renderAuth();
            fields.email.focus();
        }
        authError(error.message);
    } finally {
        button.disabled = false;
        $('#auth-back').disabled = false;
        authForm.querySelectorAll('[data-mode], [name="tipo"]').forEach(input => input.disabled = false);
        $('#auth-switch-button').disabled = false;
    }
});
bindForm(invite, status, async ({ obra, profissional }) => {
    const work = localWorks().find(item => item.id === obra);
    if (!work) throw new Error('Esta obra não está mais disponível neste navegador.');
    await api('projetos', { obra, profissional, nome: work.nome });
    renderProjects(await api('projetos'));
    status.textContent = 'Convite enviado.';
});
bindForm(projectForm, $('#dialog-status'), async fields => {
    const { id, action } = selectedAction;
    await api(`projetos/${id}/${action}`, action === 'avaliar' ? { ...fields, nota: Number(fields.nota) } : {});
    dialog.close();
    status.textContent = action === 'avaliar' ? 'Avaliação enviada.' : 'Projeto atualizado.';
    try { await showDashboard(await api('conta')); }
    catch (error) { status.textContent = error.message; }
});
$('#dialog-cancel').onclick = () => dialog.close();
$('#logout').onclick = async () => {
    try {
        await api('sair', {});
        authForm.reset();
        setMode('login');
        showAuth();
        authForm.elements.email.focus();
    } catch (error) { status.textContent = error.message; }
};
$('#professional-logout').onclick = $('#logout').onclick;

authForm.elements.tipo.value = params.get('tipo') === 'profissional' ? 'profissional' : 'cliente';
setMode(params.get('modo') === 'cadastro' ? 'cadastro' : 'login');
api('conta').then(showDashboard).catch(error => {
    if (!account) showAuth();
    if (error.status !== 401) status.textContent = error.message;
});
