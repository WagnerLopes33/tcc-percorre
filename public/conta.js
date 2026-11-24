const $ = selector => document.querySelector(selector);
const authForm = $('#auth-form');
const invite = $('#invite');
const projectForm = $('#project-form');
const dialog = $('#project-dialog');
const status = $('#account-status');
const params = new URLSearchParams(location.search);
let mode = 'login';
let selectedAction;
let account;

async function api(path, body) {
    const response = await fetch('/api/dico/' + path, body === undefined ? {} : {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw Object.assign(new Error(data.erro || 'Não foi possível concluir a operação.'), { status: response.status });
    }
    return response.json();
}

function setMode(value) {
    mode = value;
    const register = mode === 'cadastro';
    authForm.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', button.dataset.mode === mode));
    $('#auth-title').textContent = register ? 'Crie sua conta' : 'Entre no Dico';
    $('#auth-submit').textContent = register ? 'Criar conta' : 'Entrar';
    $('#name-field').hidden = !register;
    authForm.elements.nome.disabled = !register;
    authForm.elements.nome.required = register;
    authForm.elements.senha.autocomplete = register ? 'new-password' : 'current-password';
    authForm.elements.senha.minLength = register ? 8 : 0;
    status.textContent = '';
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

function renderProjects(projects) {
    const list = $('#projects');
    const labels = { pendente: 'Aguardando aceite', recusado: 'Convite recusado', andamento: 'Em andamento', finalizado: 'Finalizado' };
    list.replaceChildren();
    if (!projects.length) list.append(element('p', 'Nenhum projeto vinculado ainda.', 'muted'));
    for (const project of projects) {
        const card = element('article', '', 'card stack');
        card.append(element('h3', project.nome), element('p', labels[project.estado], 'eyebrow'),
            element('p', project.participante.nome), element('p', rating(project.avaliacao), 'muted small'));
        if (project.estado === 'pendente' && account.tipo === 'profissional') {
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

async function showDashboard({ conta, avaliacao, recebidas }) {
    const client = conta.tipo === 'cliente';
    const [projects, professionals] = await Promise.all([api('projetos'), client ? api('profissionais') : []]);
    account = conta;
    $('#auth').hidden = true;
    $('#dashboard').hidden = false;
    $('#dashboard-title').textContent = conta.nome;
    $('#dashboard-role').textContent = client ? 'Painel do cliente' : 'Painel do profissional';
    const reputation = $('#reputation');
    reputation.replaceChildren(element('h2', 'Avaliações recebidas'), element('p', rating(avaliacao)));
    for (const review of recebidas) {
        reputation.append(element('p', `${review.nome} · ${review.nota} de 5${review.comentario ? ' · ' + review.comentario : ''}`, 'review-detail'));
    }
    invite.hidden = !client;
    renderProjects(projects);
    if (client) renderInvite(professionals);
}

function showAuth() {
    account = undefined;
    $('#dashboard').hidden = true;
    $('#auth').hidden = false;
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
bindForm(authForm, status, async fields => {
    await api(mode, fields);
    authForm.elements.senha.value = '';
    await showDashboard(await api('conta'));
    $('#dashboard-title').tabIndex = -1;
    $('#dashboard-title').focus();
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

authForm.elements.tipo.value = params.get('tipo') === 'profissional' ? 'profissional' : 'cliente';
setMode(params.get('modo') === 'cadastro' ? 'cadastro' : 'login');
api('conta').then(showDashboard).catch(error => {
    if (!account) showAuth();
    if (error.status !== 401) status.textContent = error.message;
});
