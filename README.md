# Obrinha

Aplicação de TCC para planejar pequenas reformas, estimar materiais e acompanhar gastos.

## Como abrir

Abra `index.html` no navegador ou use a extensão Live Server no VS Code. Não há instalação de dependências nem etapa de compilação.

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

- Obras, compras e contatos ficam no `localStorage` deste navegador, na chave `obrinha:v2`. Não há servidor, conta ou sincronização entre dispositivos.
- A primeira abertura cria uma obra de demonstração. Depois de excluída, ela não é recriada automaticamente.
- Limpar os dados do navegador pode apagar os registros. Use **Exportar resumo**, em Meus gastos, para baixar um resumo em texto; esse arquivo não é um backup importável.
- Os preços e produtos são exemplos fornecidos no protótipo, sem consulta a preços atuais de lojas.
- Consumos, perdas e rendimentos são hipóteses do protótipo. Confira a embalagem, as condições da superfície e a adequação do produto antes da compra.
- O cômodo é tratado como retangular. Para áreas irregulares, divida em partes e cadastre separadamente.
- As fontes do Google precisam de internet; fontes alternativas são usadas quando indisponíveis.

## Verificação realizada

O JavaScript passou por verificação de sintaxe e execução com DOM simulado: inicialização, navegação, cálculos de áreas, desconto de aberturas, caixas inteiras, comparação de embalagens, recuperação de medidas na edição e persistência local. A aparência e o fluxo completo ainda precisam de conferência em um navegador real.
