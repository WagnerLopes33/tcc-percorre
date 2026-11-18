# Obrinha

## Pesquisa de preços

O menu **Pesquisar preços** e os links na tela de resultado abrem `precos.html`.
O backend usa a [SerpApi / Google Shopping](https://serpapi.com/shopping-results), um serviço externo que exige conta e chave para consultas reais. Confira as condições e a cota do seu plano.

### Executar

1. Instale Node.js (mínimo compatível: 18.18; recomendado: versão LTS atual). O servidor carrega `.env` diretamente, sem exigir opções especiais do Node.
2. No terminal da pasta do projeto, execute `npm ci` e depois `npm start`.
3. Abra `http://localhost:3000` e clique em **Pesquisar preços**.

Sem chave, a pesquisa retorna três ofertas **fictícias**, identificadas como demonstração. Para ativar a consulta real:

1. Crie um arquivo `.env` na raiz do projeto.
2. Adicione `SERPAPI_API_KEY=sua_chave`. Não coloque a chave nos arquivos HTML ou JavaScript do navegador.
3. Reinicie `npm start`.

`.env` está ignorado pelo Git e fica fora da pasta pública.

### Render

Use `npm ci` como comando de build e `npm start` como comando de inicialização. Configure `SERPAPI_API_KEY` nas variáveis de ambiente do serviço e publique a nova versão. O Express usa a porta fornecida em `PORT` e serve o site e a API no mesmo domínio. Se a chave estiver ausente no Render ou com `NODE_ENV=production`, a busca retorna HTTP 503.

### Como funciona a pesquisa

- Busca de anúncios no Brasil por descrição, marca e embalagem, com preço, loja, link e data da consulta. Os links podem abrir páginas de produto no Google Shopping.
- Cache em memória por 30 minutos, limite de 100 pesquisas armazenadas e intervalo mínimo de 3 segundos entre novas consultas. Reiniciar o servidor limpa o cache.
- Ordenação pelo preço anunciado e destaque do menor, do maior e da oferta central da amostra. Em amostras pares, destaca a oferta central inferior. Isso não classifica a qualidade dos produtos.
- Quantidade inteira de embalagens informada pelo usuário para calcular o subtotal sem frete.
- Não há confirmação automática de equivalência, estoque, entrega por CEP, unidade do preço ou rendimento. Confira o anúncio antes de usar o valor: há lojas que anunciam por m², unidade ou caixa.
- A pesquisa não modifica o orçamento salvo. Os cálculos existentes continuam com o catálogo ilustrativo; a integração automática depende de validar a correspondência entre material, embalagem e anúncio.
- Falhas da API são exibidas como erro; não são substituídas por preços fictícios.

### Verificação

Execute `npm test` para verificar normalização de ofertas, proteção de arquivos, demonstração, cache e integração com fornecedor simulado. Para conferir a interface, teste uma pesquisa, altere a quantidade e abra um anúncio. Uma consulta real exige a chave configurada.

Os testes podem ser executados com `npm.cmd test` no PowerShell.

Aplicação de TCC para planejar pequenas reformas, estimar materiais e acompanhar gastos.

## Como abrir

Execute `npm ci` e `npm start` na raiz do projeto e abra `http://localhost:3000`.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Telas, formulários, navegação e ilustrações do protótipo. |
| `style.css` | Cores, componentes e adaptação para celular. |
| `dados.js` | Catálogo ilustrativo de produtos, cômodos, serviços e parâmetros dos cálculos. |
| `script.js` | Navegação, cálculos, armazenamento, gastos e cadastro de profissionais. |
| `calculadora.html` | Calculadora rápida original de pintura, piso e contrapiso. |
| `calculadora.css` | Estilos da calculadora rápida. |
| `calculadora.js` | Cálculos, validação e orientações da calculadora rápida. |

## Fluxo principal

1. Crie uma obra e informe um orçamento, se desejar.
2. Adicione um cômodo e selecione os serviços.
3. Preencha as medidas e os detalhes dos produtos.
4. Confira os materiais e a memória dos cálculos.
5. Compare as opções ilustrativas e salve a lista no orçamento.
6. Registre compras e valores pagos na aba Meus gastos.

A aba Profissionais permite cadastrar contatos, filtrar por serviço e acessar o WhatsApp. Os contatos fictícios vêm identificados como exemplos e não possuem links de contato ativos.

## Dados e estimativas

- Obras, compras e contatos ficam no `localStorage` deste navegador, na chave `obrinha:v2`. Esses dados ficam no dispositivo em que foram registrados.
- A primeira abertura cria uma obra de demonstração. Depois de excluída, ela não é recriada automaticamente.
- Limpar os dados do navegador pode apagar os registros. Use **Exportar resumo**, em Meus gastos, para baixar um resumo em texto; esse arquivo não é um backup importável.
- O orçamento usa o catálogo ilustrativo. A tela Pesquisar preços consulta as ofertas anunciadas no Google Shopping.
- Consumos, perdas e rendimentos são hipóteses do protótipo. Confira a embalagem, as condições da superfície e a adequação do produto antes da compra.
- O cômodo é tratado como retangular. Para áreas irregulares, divida em partes e cadastre separadamente.
- As fontes do Google precisam de internet; fontes alternativas são usadas quando indisponíveis.

## Verificação realizada

O JavaScript passou por verificação de sintaxe e execução com DOM simulado: inicialização, navegação, cálculos de áreas, desconto de aberturas, caixas inteiras, comparação de embalagens, recuperação de medidas na edição e persistência local. A aparência e o fluxo completo ainda precisam de conferência em um navegador real.
