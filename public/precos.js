const form = document.getElementById('search-prices');
const status = document.getElementById('price-status');
const results = document.getElementById('price-results');
const money = value => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
function element(tag, text, cls) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (cls) node.className = cls;
    return node;
}
const initial = new URLSearchParams(location.search).get('q');
if (initial) document.getElementById('query').value = initial.slice(0, 160);
form.addEventListener('submit', async event => {
    event.preventDefault();
    results.replaceChildren();
    const button = document.getElementById('search-button');
    button.disabled = true;
    status.textContent = 'Consultando ofertas…';
    try {
        if (location.protocol === 'file:') throw new Error('Abra a aplicação pelo servidor: execute npm start e acesse http://localhost:3000.');
        const response = await fetch(`/api/precos?q=${encodeURIComponent(document.getElementById('query').value.trim())}`, { signal: AbortSignal.timeout(25000) });
        if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Inicie o backend com npm start e abra http://localhost:3000.');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível pesquisar.');
        status.textContent = `${data.demo ? 'DEMONSTRAÇÃO — preços fictícios. Configure SERPAPI_API_KEY no servidor para buscar ofertas reais.' : 'Ofertas encontradas — confira se os produtos são equivalentes.'} Fonte: ${data.source}. Consulta: ${new Date(data.updatedAt).toLocaleString('pt-BR')}${data.cached ? ' (resultado em cache)' : ''}.`;
        if (!data.offers.length) { results.append(element('p', 'Nenhuma oferta encontrada. Tente especificar outra marca ou embalagem.')); return; }
        results.append(element('p', `${data.offers.length} anúncios ordenados por preço anunciado. As faixas abaixo se referem apenas a esta amostra e não indicam qualidade.`));
        const middle = Math.floor((data.offers.length - 1) / 2);
        data.offers.forEach((offer, i) => {
            const card = element('article', '', 'card stack');
            const badges = [];
            if (i === 0) badges.push('Menor preço encontrado');
            if (i === middle) badges.push('Próximo da mediana');
            if (i === data.offers.length - 1) badges.push('Maior preço encontrado');
            if (badges.length) card.append(element('p', badges.join(' · '), 'badge b-neu'));
            card.append(element('h2', offer.title), element('p', offer.store), element('strong', money(offer.price), 'price'), element('p', `${offer.delivery}. Frete não somado à estimativa.`, 'small muted'));
            if (offer.link) {
                const link = element('a', 'Conferir anúncio ↗');
                const target = new URL(offer.link);
                if (['http:', 'https:'].includes(target.protocol)) { link.href = target.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; card.append(link); }
            }
            const label = element('label', 'Quantidade de embalagens (confirme o anúncio)');
            const quantity = document.createElement('input');
            quantity.type = 'number'; quantity.min = '1'; quantity.max = '100000'; quantity.step = '1'; quantity.value = '1';
            label.append(quantity);
            const total = element('p', `Subtotal sem frete: ${money(offer.price)}`);
            quantity.addEventListener('input', () => { total.textContent = quantity.validity.valid && quantity.value ? `Subtotal sem frete: ${money(offer.price * Number(quantity.value))}` : 'Informe uma quantidade inteira entre 1 e 100.000.'; });
            card.append(label, total);
            results.append(card);
        });
    } catch (error) { status.textContent = error.name === 'TimeoutError' ? 'A consulta demorou demais. Tente novamente.' : error.message; }
    finally { button.disabled = false; }
});
