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
const category = document.getElementById('category');
const details = document.getElementById('details');
const button = document.getElementById('search-button');
const initial = new URLSearchParams(location.search);

function updatePlaceholder() {
    const example = category.selectedOptions[0]?.dataset.example;
    details.placeholder = example ? `Ex.: ${example}` : 'Marca, tipo, medida ou embalagem';
}

async function loadCategories() {
    try {
        const response = await fetch('/api/precos/categorias');
        if (!response.ok) throw new Error();
        for (const { id, label, example } of await response.json()) {
            const option = new Option(label, id);
            option.dataset.example = example;
            category.add(option);
        }
        const selected = initial.get('categoria');
        if ([...category.options].some(option => option.value === selected)) category.value = selected;
        updatePlaceholder();
        category.disabled = false;
        button.disabled = false;
    } catch {
        status.textContent = 'Não foi possível carregar as categorias. Recarregue a página ou abra a aplicação pelo servidor com npm start.';
        status.classList.add('is-error');
    }
}
loadCategories();
category.addEventListener('change', updatePlaceholder);

form.addEventListener('submit', async event => {
    event.preventDefault();
    results.replaceChildren();
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    status.classList.remove('is-error');
    status.textContent = 'Consultando ofertas…';
    try {
        const params = new URLSearchParams({ categoria: category.value, detalhes: details.value.trim() });
        const response = await fetch(`/api/precos?${params}`, { signal: AbortSignal.timeout(25000) });
        if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Inicie o backend com npm start e abra http://localhost:3000.');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Não foi possível pesquisar.');
        const count = data.offers.length;
        const summary = count === 1 ? '1 oferta encontrada.' : `${count} ofertas encontradas.`;
        status.textContent = `${summary} ${data.demo ? 'Demonstração com preços fictícios. ' : ''}Fonte: ${data.source}. Consulta: ${new Date(data.updatedAt).toLocaleString('pt-BR')}${data.cached ? ' (em cache)' : ''}.`;
        if (!count) {
            results.append(element('p', 'Nenhum anúncio correspondeu ao material. Tente trocar a marca, a medida ou a embalagem.', 'card'));
            return;
        }
        results.append(element('h2', 'Ofertas por menor preço'));
        const grid = element('div', '', 'prices-grid');
        results.append(grid);
        const middle = Math.floor((data.offers.length - 1) / 2);
        data.offers.forEach((offer, i) => {
            const card = element('article', '', 'card stack price-offer');
            if (count > 1 && i === 0) card.append(element('p', 'Menor preço', 'badge b-ok'));
            if (count > 2 && i === middle) card.append(element('p', 'Oferta central', 'badge b-neu'));
            if (count > 1 && i === count - 1) card.append(element('p', 'Maior preço', 'badge b-or'));
            card.append(element('h3', offer.title), element('p', offer.store, 'muted'), element('strong', money(offer.price), 'price num'), element('p', offer.delivery, 'small muted'));
            if (offer.link) {
                const link = element('a', 'Conferir anúncio ↗', 'btn btn-sec');
                const target = new URL(offer.link);
                if (['http:', 'https:'].includes(target.protocol)) { link.href = target.href; link.target = '_blank'; link.rel = 'noopener noreferrer'; card.append(link); }
            }
            const label = element('label', 'Quantidade de embalagens', 'field lbl');
            const quantity = document.createElement('input');
            quantity.type = 'number'; quantity.min = '1'; quantity.max = '100000'; quantity.step = '1'; quantity.value = '1';
            label.append(quantity);
            const total = element('p', `Subtotal sem frete: ${money(offer.price)}`, 'price-subtotal num');
            quantity.addEventListener('input', () => { total.textContent = quantity.validity.valid && quantity.value ? `Subtotal sem frete: ${money(offer.price * Number(quantity.value))}` : 'Informe uma quantidade inteira entre 1 e 100.000.'; });
            card.append(label, total);
            grid.append(card);
        });
    } catch (error) {
        status.classList.add('is-error');
        status.textContent = error.name === 'TimeoutError' ? 'A consulta demorou demais. Tente novamente.' : error.message;
    } finally {
        form.removeAttribute('aria-busy');
        button.disabled = false;
    }
});
