// Configurações dos serviços: [identificador, rótulo, valor inicial, orientação].
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

// Elementos da página e serviço selecionado.
const form = document.querySelector('#form');
const result = document.querySelector('#result');
const fields = document.querySelector('#fields');
const help = document.querySelector('#help');
const serviceButtons = document.querySelectorAll('[data-service]');
let selectedService = 'pintura';

// Formatação dos valores exibidos.
function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR', {
        maximumFractionDigits: 3,
    }).format(value);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

// Montagem dos campos e do estado inicial do resultado.
function createField([id, label, value, hint]) {
    const allowsZero = ['preco', 'desconto', 'sobra'].includes(id);
    const isOptional = id === 'preco';
    const placeholder = isOptional ? 'Opcional' : 'Ex.: 3';
    const initialValue = value === null
        ? `placeholder="${placeholder}"`
        : `value="${value}"`;

    return `
        <label for="${id}">
            ${label}
            <input
                id="${id}"
                name="${id}"
                type="number"
                inputmode="decimal"
                min="${allowsZero ? 0 : 0.01}"
                step="${id === 'demaos' ? 1 : 'any'}"
                ${id === 'sobra' ? 'max="100"' : ''}
                ${isOptional ? '' : 'required'}
                ${initialValue}
                ${hint ? `aria-describedby="${id}-hint"` : ''}
            >
            ${hint ? `<small id="${id}-hint">${hint}</small>` : ''}
        </label>
    `;
}

function renderForm() {
    const config = configs[selectedService];

    help.textContent = config.help;
    fields.innerHTML = config.fields.map(createField).join('');
    result.innerHTML = `
        <div class="empty-icon" aria-hidden="true">⌂</div>
        <h3>Vamos tirar os planos do papel?</h3>
        <p>Preencha as medidas para descobrir uma estimativa de materiais.</p>
        <p>Um pouco de planejamento faz a diferença.</p>
    `;
}

// Cálculos por serviço. As quantidades são arredondadas para cima.
function calculatePainting(data, area, wasteFactor) {
    if (data.desconto >= area) {
        throw new Error('A área de portas e janelas deve ser menor que a área da parede.');
    }

    const paintableArea = area - data.desconto;
    const liters = paintableArea * data.demaos / data.rendimento * wasteFactor;

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
    const secondDimension = service === 'pintura' ? data.altura : data.comprimento;
    const area = data.largura * secondDimension;
    const wasteFactor = 1 + data.sobra / 100;

    switch (service) {
        case 'pintura':
            return calculatePainting(data, area, wasteFactor);
        case 'piso':
            return calculateFlooring(data, area, wasteFactor);
        default:
            return calculateSubfloor(data, area, wasteFactor);
    }
}

// Leitura do formulário e apresentação da estimativa.
function readFormData() {
    const entries = [...new FormData(form)].map(([key, value]) => [
        key,
        value === '' ? null : Number(value),
    ]);

    return Object.fromEntries(entries);
}

function renderEstimate(estimate, data) {
    estimate.rows.push(['Margem de sobra', `${formatNumber(data.sobra)}%`]);

    if (data.preco !== null) {
        const cost = estimate.quantity * data.preco;
        estimate.rows.push(['Custo estimado do material', formatCurrency(cost)]);
    }

    const rowsHtml = estimate.rows.map(([label, value]) => `
        <div class="row">
            <span>${label}</span>
            <strong>${value}</strong>
        </div>
    `).join('');

    result.innerHTML = `
        <span class="eyebrow">VOCÊ VAI PRECISAR DE CERCA DE</span>
        <div class="amount">
            ${formatNumber(estimate.quantity)}
            <span>${estimate.unit}</span>
        </div>
        ${rowsHtml}
        <p class="assumption">${estimate.note}</p>
        <p class="assumption">
            ${data.preco === null ? 'Informe um preço para estimar o custo. ' : ''}
            Mão de obra, frete e outros insumos não estão incluídos.
        </p>
    `;
}

function handleSubmit(event) {
    event.preventDefault();
    const data = readFormData();

    try {
        const estimate = calculate(selectedService, data);
        const invalidQuantity = !Number.isFinite(estimate.quantity) || estimate.quantity <= 0;
        const invalidCost = data.preco !== null
            && !Number.isFinite(estimate.quantity * data.preco);

        if (invalidQuantity || invalidCost) {
            throw new Error('Revise as medidas: os valores informados são muito grandes.');
        }

        renderEstimate(estimate, data);
    } catch (error) {
        result.textContent = error.message;
    }
}

// Eventos e inicialização.
serviceButtons.forEach(button => {
    button.addEventListener('click', () => {
        selectedService = button.dataset.service;

        serviceButtons.forEach(tab => {
            tab.setAttribute('aria-pressed', String(tab === button));
        });

        renderForm();
    });
});

form.addEventListener('submit', handleSubmit);
renderForm();
