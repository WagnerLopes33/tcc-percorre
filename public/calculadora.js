// Configurações dos serviços: [id, rótulo, valor inicial, orientação].
const configs = {
    pintura: {
        help: 'Informe as medidas de uma parede e o rendimento da tinta por demão.',
        fields: [
            ['largura', 'Largura da parede (m)', null],
            ['altura', 'Altura da parede (m)', null],
            ['desconto', 'Portas e janelas (m²)', 0, 'Área que não receberá pintura.'],
            ['demaos', 'Número de demãos', 2],
            ['rendimento', 'Rendimento (m²/L por demão)', 10, 'Confira na embalagem; o valor inicial é um exemplo.'],
            ['sobra', 'Margem de sobra (%)', 10],
            ['preco', 'Preço por litro (R$)', null, 'Opcional: preço da lata dividido pelos litros.'],
        ],
    },
    piso: {
        help: 'Informe as medidas do ambiente e a cobertura da caixa de piso.',
        fields: [
            ['largura', 'Largura do ambiente (m)', null],
            ['comprimento', 'Comprimento do ambiente (m)', null],
            ['cobertura', 'Cobertura por caixa (m²)', null, 'Consulte a embalagem do piso.'],
            ['sobra', 'Margem para recortes (%)', 10, 'Ajuste conforme a paginação e os recortes.'],
            ['preco', 'Preço por caixa (R$)', null, 'Opcional.'],
        ],
    },
    contrapiso: {
        help: 'Estime o volume da mistura para uma superfície retangular de espessura uniforme.',
        fields: [
            ['largura', 'Largura do ambiente (m)', null],
            ['comprimento', 'Comprimento do ambiente (m)', null],
            ['espessura', 'Espessura (cm)', null, 'Informe em centímetros. Valide a espessura com um profissional.'],
            ['sobra', 'Margem de sobra (%)', 10],
            ['preco', 'Preço da mistura por m³ (R$)', null, 'Opcional: consulte o fornecedor.'],
        ],
    },
};

const specs = {
    largura: {
        title: 'Largura',
        text: 'Meça a largura do espaço com uma trena, em metros.<br><b>Como medir:</b> posicione a trena de uma ponta à outra. Ex.: 3,50 m.<br><b>No cálculo:</b> usada para obter a área (<i>largura × altura/comprimento</i>).',
    },
    altura: {
        title: 'Altura da parede',
        text: 'Meça do piso ao teto, em metros.<br><b>Como medir:</b> use a trena na vertical. Ex.: 2,70 m.<br><b>Fórmula:</b> <i>área da parede = largura × altura</i>.',
    },
    comprimento: {
        title: 'Comprimento',
        text: 'Meça o comprimento do ambiente com uma trena, em metros.<br><b>Como medir:</b> posicione a trena de uma ponta à outra. Ex.: 4,00 m.<br><b>Fórmula:</b> <i>área do ambiente = largura × comprimento</i>.',
    },
    desconto: {
        title: 'Portas e janelas',
        text: 'Some a área das aberturas que não serão pintadas, em m².<br><b>Como calcular:</b> para cada abertura, <i>largura × altura</i> e some os resultados. Ex.: porta 0,80 × 2,10 = 1,68 m².<br><b>Fórmula:</b> <i>área a pintar = área da parede − aberturas</i>.',
    },
    demaos: {
        title: 'Número de demãos',
        text: 'Quantidade de camadas de tinta aplicadas.<br><b>Como definir:</b> cores claras ou repintura costumam usar 2; mudanças fortes de cor podem exigir 3 ou mais. Confira a recomendação do fabricante.<br><b>Fórmula:</b> <i>tinta = área a pintar × demãos ÷ rendimento</i>.',
    },
    rendimento: {
        title: 'Rendimento da tinta',
        text: 'Quantos m² um litro cobre por demão.<br><b>Onde encontrar:</b> informado na embalagem/lata (m²/L/demão). Ex.: 10 m²/L.<br><b>Fórmula:</b> <i>litros = área a pintar × demãos ÷ rendimento</i>, depois aplica-se a sobra.',
    },
    sobra: {
        title: 'Margem de sobra',
        text: 'Percentual extra para perdas de recorte, respingos e aplicação.<br><b>Como definir:</b> 10% é comum; aumente em áreas com muitos recortes.<br><b>Fórmula:</b> <i>quantidade final = quantidade × (1 + sobra ÷ 100)</i>. Ex.: 10 com 10% = 10 × 1,10 = <b>11</b>.',
    },
    preco: {
        title: 'Preço unitário',
        text: 'Valor por unidade de compra (litro, caixa ou m³), em reais.<br><b>Como preencher:</b> informe o preço da unidade que você vai comprar. Ex.: se a lata de 3,6 L custa R$ 120, preço por litro = 120 ÷ 3,6.<br><b>Fórmula:</b> <i>custo estimado = quantidade × preço</i>. Campo opcional.',
    },
    cobertura: {
        title: 'Cobertura por caixa',
        text: 'Quantos m² uma caixa de piso cobre.<br><b>Onde encontrar:</b> informado na embalagem. Ex.: 2,20 m² por caixa.<br><b>Fórmula:</b> <i>caixas = área com margem ÷ cobertura</i>, arredondado para cima (caixas inteiras).',
    },
    espessura: {
        title: 'Espessura do contrapiso',
        text: 'Grossura da camada, em centímetros.<br><b>Como definir:</b> depende do projeto; valide com um profissional. Ex.: 5 cm.<br><b>Fórmula:</b> <i>volume = área × (espessura ÷ 100) × (1 + sobra ÷ 100)</i>, em m³.',
    },
};

const form = document.querySelector('#form');
const fieldsContainer = document.querySelector('#fields');
const help = document.querySelector('#help');
const result = document.querySelector('#result');
const serviceButtons = document.querySelectorAll('[data-service]');
let selectedService = 'pintura';
let openTip = null;

function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(value);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function closeTip() {
    if (openTip) {
        openTip.remove();
        openTip = null;
        document.removeEventListener('click', onDocumentClick);
    }
}

function onDocumentClick(event) {
    if (openTip && !openTip.contains(event.target)) {
        closeTip();
    }
}

function showTip(event, id) {
    event.preventDefault();
    event.stopPropagation();
    closeTip();
    const spec = specs[id] || { title: id, text: 'Informe o valor solicitado neste campo.' };
    const tip = document.createElement('div');
    tip.className = 'lamp-tooltip';
    tip.innerHTML = `<b>${spec.title}</b><br>${spec.text}`;
    document.body.appendChild(tip);
    const rect = event.currentTarget.getBoundingClientRect();
    const left = Math.max(12, Math.min(window.innerWidth - tip.offsetWidth - 12, rect.left + (rect.width - tip.offsetWidth) / 2));
    const top = rect.top - tip.offsetHeight - 10 + window.scrollY;
    tip.style.left = `${left}px`;
    tip.style.top = `${Math.max(8 + window.scrollY, top)}px`;
    requestAnimationFrame(() => tip.classList.add('open'));
    openTip = tip;
    tip.addEventListener('click', (e) => e.stopPropagation());
    setTimeout(() => document.addEventListener('click', onDocumentClick), 0);
}

function createField([id, label, value, hint]) {
    const allowsZero = ['preco', 'desconto', 'sobra'].includes(id);
    const isOptional = id === 'preco';
    const placeholder = isOptional ? 'Opcional' : 'Ex.: 3';
    const initialValue = value === null ? `placeholder="${placeholder}"` : `value="${value}"`;
    return `
        <label for="${id}">
            <span class="label-row">
                <span>${label}</span>
                <button type="button" class="lamp-btn" data-spec="${id}" aria-label="Especificações de ${label}" title="Especificações">i</button>
            </span>
            <input
                id="${id}"
                name="${id}"
                type="number"
                inputmode="decimal"
                min="${allowsZero ? 0 : 0.01}"
                step="${id === 'demaos' ? 1 : 'any'}"
                ${id === 'sobra' ? 'max="100"' : ''}
                ${initialValue}
                ${hint ? `aria-describedby="${id}-hint"` : ''}
            >
            ${hint ? `<small id="${id}-hint">${hint}</small>` : ''}
        </label>
    `;
}

function renderForm() {
    closeTip();
    const config = configs[selectedService];
    help.textContent = config.help;
    fieldsContainer.innerHTML = config.fields.map(createField).join('');
    fieldsContainer.querySelectorAll('.lamp-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => showTip(e, btn.dataset.spec));
    });
    result.innerHTML = `
        <div class="empty-icon" aria-hidden="true">⌂</div>
        <h3>Vamos tirar os planos do papel?</h3>
        <p>Preencha as medidas para descobrir uma estimativa de materiais.</p>
        <p>Um pouco de planejamento faz a diferença.</p>
    `;
}

function readFormData() {
    const data = {};
    for (const [id] of configs[selectedService].fields) {
        const input = form.elements[id];
        const raw = input.value.trim();
        data[id] = raw === '' ? null : Number(raw);
    }
    return data;
}

function validate(data) {
    const errors = [];
    for (const [id, label] of configs[selectedService].fields) {
        const value = data[id];
        const optional = id === 'preco';
        if (value === null) {
            if (!optional) errors.push(`Informe "${label}".`);
            continue;
        }
        if (!Number.isFinite(value)) {
            errors.push(`"${label}" inválido.`);
            continue;
        }
        const allowsZero = ['preco', 'desconto', 'sobra'].includes(id);
        if (!allowsZero && value <= 0) errors.push(`"${label}" deve ser maior que zero.`);
        if (allowsZero && value < 0) errors.push(`"${label}" não pode ser negativo.`);
        if (id === 'sobra' && value > 100) errors.push(`"Margem de sobra" não pode ser maior que 100%.`);
        if (id === 'demaos' && !Number.isInteger(value)) errors.push(`"Número de demãos" deve ser inteiro.`);
    }
    return errors;
}

function calculatePainting(data, area, wasteFactor) {
    if (data.desconto >= area) {
        throw new Error('A área de portas e janelas deve ser menor que a área da parede.');
    }
    const paintableArea = area - data.desconto;
    const liters = (paintableArea * data.demaos / data.rendimento) * wasteFactor;
    return {
        quantity: Math.ceil(liters * 100) / 100,
        unit: 'litros de tinta',
        rows: [
            ['Área a pintar', `${formatNumber(paintableArea)} m²`],
            ['Demãos', formatNumber(data.demaos)],
        ],
        note: `Área × demãos ÷ rendimento de ${formatNumber(data.rendimento)} m²/L por demão, com sobra. Arredondado para cima em 0,01 L. Adeque a compra aos tamanhos de lata disponíveis.`,
    };
}

function calculateFlooring(data, area, wasteFactor) {
    const areaWithWaste = area * wasteFactor;
    const boxes = Math.ceil(areaWithWaste / data.cobertura);
    return {
        quantity: boxes,
        unit: boxes === 1 ? 'caixa de piso' : 'caixas de piso',
        rows: [
            ['Área do ambiente', `${formatNumber(area)} m²`],
            ['Área com margem', `${formatNumber(areaWithWaste)} m²`],
            ['Cobertura da compra', `${formatNumber(boxes * data.cobertura)} m²`],
        ],
        note: 'Área com margem dividida pela cobertura da caixa, arredondando para caixas inteiras. Argamassa e rejunte não estão incluídos.',
    };
}

function calculateSubfloor(data, area, wasteFactor) {
    const thicknessInMeters = data.espessura / 100;
    const volume = Math.ceil(area * thicknessInMeters * wasteFactor * 1000) / 1000;
    return {
        quantity: volume,
        unit: 'm³ de mistura',
        rows: [
            ['Área do ambiente', `${formatNumber(area)} m²`],
            ['Espessura', `${formatNumber(data.espessura)} cm`],
            ['Volume em litros', `${formatNumber(volume * 1000)} L`],
        ],
        note: 'Área × espessura em metros, com sobra. Arredondado para cima em 0,001 m³. As quantidades de cimento e areia dependem do traço e não são estimadas aqui.',
    };
}

function calculate(service, data) {
    const second = service === 'pintura' ? data.altura : data.comprimento;
    const area = data.largura * second;
    const wasteFactor = 1 + data.sobra / 100;
    if (service === 'pintura') return calculatePainting(data, area, wasteFactor);
    if (service === 'piso') return calculateFlooring(data, area, wasteFactor);
    return calculateSubfloor(data, area, wasteFactor);
}

function renderEstimate(estimate, data) {
    estimate.rows.push(['Margem de sobra', `${formatNumber(data.sobra)}%`]);
    if (data.preco !== null) {
        estimate.rows.push(['Custo estimado do material', formatCurrency(estimate.quantity * data.preco)]);
    }
    const rowsHtml = estimate.rows.map(([label, value]) => `
        <div class="row"><span>${label}</span><strong>${value}</strong></div>
    `).join('');
    result.innerHTML = `
        <span class="eyebrow">VOCÊ VAI PRECISAR DE CERCA DE</span>
        <div class="amount">${formatNumber(estimate.quantity)}<span>${estimate.unit}</span></div>
        ${rowsHtml}
        <p class="assumption">${estimate.note}</p>
        <p class="assumption">${data.preco === null ? 'Informe um preço para estimar o custo. ' : ''}Mão de obra, frete e outros insumos não estão incluídos.</p>
    `;
}

function renderError(messages) {
    const list = messages.map((m) => `<li>${m}</li>`).join('');
    result.innerHTML = `<div class="result-error"><h3>Revise os campos</h3><ul>${list}</ul></div>`;
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = readFormData();
    const errors = validate(data);
    if (errors.length) {
        renderError(errors);
        return;
    }
    try {
        const estimate = calculate(selectedService, data);
        const invalidQty = !Number.isFinite(estimate.quantity) || estimate.quantity <= 0;
        const invalidCost = data.preco !== null && !Number.isFinite(estimate.quantity * data.preco);
        if (invalidQty || invalidCost) throw new Error('Revise as medidas: os valores informados são muito grandes.');
        renderEstimate(estimate, data);
    } catch (error) {
        renderError([error.message]);
    }
});

serviceButtons.forEach((button) => {
    button.addEventListener('click', () => {
        selectedService = button.dataset.service;
        serviceButtons.forEach((tab) => tab.setAttribute('aria-pressed', String(tab === button)));
        renderForm();
    });
});

renderForm();
