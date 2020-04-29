# Projeto Garantias da União

Este texto descreve e procura documentar, principalmente, o processo de construção da história das garantias, disponível em

https://tchiluanda.github.io/garantias/

Caso você esteja apenas em busca dos dados (como disse o [pessoal do Estadão](https://github.com/estadao/basometro): "Eu só quero acessar os dados, nem sei o que tô fazendo aqui nesse site"), dê uma olhada [aqui](webpage/dados/readme.md).

## Estrutura básica 

### Idéia original

1. Contexto, histórico
   Visualização: as dívidas de Estados e Municípios

2. As garantias
   Visualização: saldo das garantias concecidas pela União (bubble chart)

3. As garantias: em detalhes, os contratos
   Visualização: "card" do ente selecionado, lista de todos os contratos garantidos para este ente. Fazer mapa?

4. O que acontece quando o estado ou o município não paga o empréstimo?
   Visualização: as honras &mdash streamgraph, transição para novo bubble chart.


#### O contexto

A ideia inicial é contextualizar as garantias concedidas pela União no cenário das dívidas dos entes subnacionais (Estados, Municípios e Distrito Federal). Assim, podemos segmentar o endividamento total dos entes subnacionais em três componentes:

i. a dívida com a União, decorrente do refinanciamento/renegociação/reestruturação da dívida desses entes;
ii. a dívida com instituições financeiras, sem garantia da União; e
iii. a dívida com instituições financeiras, com garantia da União mdash que é o foco principal desta história.

Definida essa segmentação, o próximo passo é buscar os dados. Aí temos o seguinte cenário:

* (iii) está disponível no Relatório Quadrimestral de Garantias, sem problemas. Só é preciso disponibilizar no CKAN.

* O Sadipem, na opção "CDP", "Baixar o cadastro completo", traz uma tabela "05-dividas-execucao-financeira" que detalha os saldos devedores nas datas-base de cada ente, para cada tipo de dívida. Em tese seria possível obter o valor (i) dessa base.

* O Siconfi traz os demonstrativos da Dívida Consolidada declarados pelos entes em seus RGF, o que permitiria obter também a informação (i), e de forma tempestiva (para 2019, no caso). Para isso baixamos os arquivos correspondentes às combinações, em "Fibra", "RGF": periodicidade quadrimestral, período 3º quadrimestre, Poder Executivo, Anexo 02, escopo Estados, e, depois, Municípios. Além disso, é preciso usar também a combinação periodicidade semestral, período 2º semestre, Poder Executivo, Anexo 02, escopo Municípios. No entanto, o valor total obtido valor não bate com o obtido do Sadipem, mesmo excluindo o tipo de dívida "Passivo Atuarial" do Sadipem. Obs.: Esse mesmo dado do Siconfi é apresentado no painel https://www.tesourotransparente.gov.br/historias/visao-integrada-das-dividas-da-uniao-dos-estados-do-distrito-federal-e-dos-municipios. Seria uma forma de referenciar o dado a uma fonte mais simples.

* Por ocasião da elaboração do Boletim dos Entes Subnacionais, a equipe técnica do Tesouro faz um trabalho de batimento dos dados dos RGF com os dados do Sadipem, mas essencialmente para o Estados. Assim, os dados do boletim seriam os mais confiáveis para a informação (i). No entanto, esses dados apresentam uma defasagem e só se referem a Estados.

* (i) pode ser obtido do TT. Em última análise, pode-se usar o dado do próprio Anexo 2 do RGF dos entes, na linha "Reestruturação da Dívida de Estados e Municípios". No entanto, o dado do Tesouro mostra um saldo de 640 bilhões, e a DCL, 93 bi (que é o mesmo valor do Sadipem para essa mesma rubrica). Há um grande valor na rubrica "Empréstimos internos", o que deve indicar uma classificação inadequada dos valores por parte dos entes.

### A estrutura final

No final, as visualizações acabaram ficando bastante complexas (duas delas acabaram ficando no formato de scrollytelling). Além disso a história ficou comprida, então resolvemos fragmentá-la em três partes mais curtinhas e encadeadas, mas com algum grau de independência entre si. 

Primeira parte: As Garantias Concedidas pela União

https://tchiluanda.github.io/garantias/


Segunda parte: As honras de garantias

https://tchiluanda.github.io/garantias/honras/

 
Terceira parte: Uma visão geral das dívidas de Estados e Municípios

https://tchiluanda.github.io/garantias/dividas/


## Pipeline da análise

### 1. `R_prep_vis/prepara_dados_vis.R`

Consome: 
* [`R_prep_vis/Garantias_dez_2019.RData`](R_prep_vis/Garantias_dez_2019.RData) (gerado no processamento do painel de garantias).

Produz:
* [`webpage/dados/dados_vis_garantias.csv`](webpage/dados/dados_vis_garantias.csv), a ser consumido por [`webpage/visualizacao.js`](webpage/visualizacao.js), a visualização da Parte 1 (gráfico de bolhas).

* [`/R_prep_vis/outros_dados/total_garantias_classificador.RData`](/R_prep_vis/outros_dados/total_garantias_classificador.RData), a ser consumido por [`R_prep_vis/prep_dados_divida_total.R`](R_prep_vis/prep_dados_divida_total.R). (<span style="background-color: goldenrod;">Melhorar:</span> mover dado intermediário para uma pasta específica), que vai preparar os dados para a visualização da Parte 3 (ver próximo tópico)

* [`webpage/dados/dados_quadro.csv`](webpage/dados/dados_quadro.csv), a ser consumido por [`webpage/quadro.js`](webpage/quadro.js), a visualização da Parte 1 (card das entidades, com o gráfico de barras).

* [`webpage/dados/contratos.csv`](webpage/dados/contratos.csv), a ser consumido por [`webpage/quadro.js`](webpage/quadro.js), a tabela da Parte 1.

* [`webpage/dados/dados_honras_det.csv`](webpage/dados/dados_honras_det.csv) e [`webpage/dados/dados_honras_agg.csv`](webpage/dados/dados_honras_agg.csv), a ser consumido por [`webpage/vis-honras.js`](webpage/honras.js), a visualização da Parte 2.

### 2. `R_prep_vis/prep_dados_divida_total.R`

Consome: 
* [`R_prep_vis/outros_dados/finbraRGF_2019_estados.csv`](R_prep_vis/outros_dados/finbraRGF_2019_estados.csv)
* [`R_prep_vis/outros_dados/finbraRGF_2019_mun_quad.csv`](R_prep_vis/outros_dados/finbraRGF_2019_mun_quad.csv)
* [`R_prep_vis/outros_dados/finbraRGF_2019_mun_sem.csv`](R_prep_vis/outros_dados/finbraRGF_2019_mun_sem.csv)
* [`R_prep_vis/outros_dados/SALDOS_DEVEDORES_PROGRAMAS_FINANCIAMENTO_GOVERNO_FEDERAL_2020jan.xls`](R_prep_vis/outros_dados/SALDOS_DEVEDORES_PROGRAMAS_FINANCIAMENTO_GOVERNO_FEDERAL_2020jan.xls)
* [`R_prep_vis/outros_dados/total_garantias_classificador.RData`](R_prep_vis/outros_dados/total_garantias_classificador.RData)

Produz:
* [`webpage/dados/dividas_totais.csv`](webpage/dados/dividas_totais.csv), a ser consumido por [`webpage/vis-endividamento.js`](webpage/vis-endividamento.js)


## Observações sobre os dados do `garantias_dez_2019.RData`

Dados apenas de mutuários: 

* Garantias totais (interna, cambial, total) -- `agrupador_total`
* ATM (avg time to maturity) -- `agrupador_atm_completo`
* Custos -- `agrupador_custo_completo` (?)
* Percentual vincendo -- `agrupador_percentual_vincendo_total`

Estão em [garantias.RData](./R/garantias.RData).

Em falta: 

* Novos contratos (tem arquivo próprio, ver a seção de Pipeline da Análise)
* Capag

Classificador `Garantias Total` nos demais dfs equivale ao classificador `Todas` em `agrupador_total`.

### agrupador_total

Algumas observações:

"Total de Operações de Crédito": `total_total`
"Internas": `interna_total`
"Interna Cambial": `interna_USD`
"Demais": pela diferença
"Externas": `externa_total`

### agrupador_atm_completo

## Licões aprendidas (D3/Web)

Para a construção das páginas, utilizamos HTML, CSS, JS e D3 escritos à mão, sem frameworks.

Algo que facilitou foi usar um arquivo `.js` para cada viz. Já tinha resolvido fazer isso, e aquela mini conversa com a Amber Thomas no Slack confirmou que é uma boa prática.

Juntar todas as funções comuns a pelo menos dois `.js` num arquivo à parte, que aqui chamei de [`webpage/utils.js`](webpage/utils.js).

Separar os estilos em um `.css` geral, e outros específicos para cada viz. Ajuda a deixar o negócio gerenciável. E ajuda a se valer da *cascade* para soluções bem interessantes, com regras mais concisas e elegantes.

### Force-Layout

A simulação vai gerar valores de "x" e "y" para os nodes que foram passados para ela. Para manter a constância do objeto, é importante iniciar esses valores x e y dos nodes com as posições onde estarão as bolhas quando a simulação for iniciada (nesse caso, a posição das bolhas no dot plot).

### Scrollytelling

Usamos o [scrollama](https://github.com/russellgoldenberg/scrollama), do Russell. 

## Referências / inspirações

Tabelas como essa daqui:
https://pudding.cool/2018/08/wiki-death/

Print do css está no Google Docs.

Inspiração para o gráfico de bolhas:
https://archive.nytimes.com/www.nytimes.com/interactive/2012/02/13/us/politics/2013-budget-proposal-graphic.html

Tutorial do Jim:
https://vallandingham.me//bubble_charts_with_d3v4.html

Streamgraph para honras
![](streamgraph_hflip_shorter.svg)


## Páginas relacionadas dentro do site

http://tesouro.gov.br/web/stn/portal-de-garantias-da-uniao

O conteúdo do Portal de Garantias da União está organizado da seguinte forma: 
 
* Critérios de elegibilidade para concessão de garantias do Tesouro aos tomadores de recursos;
* Relatórios Mensal de Honras de Avais e Quadrimestral de Garantias; Limites estabelecidos pelo Senado Federal;
* Ações de modernização do Sistema de Garantias da União;
* Resoluções e funcionamento do Comitê de Garantias da STN; 
* Portarias MF e STN relacionadas à concessão de Garantias pela União; e
* Manuais, fluxos de procedimentos e legislação aplicável.

https://www.tesourotransparente.gov.br//visualizacao/previa-fiscal
(avaliação da capacidade de pagamento dos entes subnacionais, o principal indicador de saúde fiscal utilizado pelo Tesouro Nacional para definir a sustentabilidade fiscal dos entes)

Manual para instrução de pleitos
https://conteudo.tesouro.gov.br/manuais/index.php?option=com_content&view=categories&id=58&Itemid=274


https://www.tesouro.fazenda.gov.br/pt/-/concessao-de-garantia-pela-uniao

https://www.tesourotransparente.gov.br/visualizacao/painel-de-operacoes-de-credito


## Evoluções

Lista
* mostrar na tabela as que foram honrados, e já fazer o gancho para a próxima parte. [ok]

* fiz um teste, quais honras não aparecem na lista de contratos: Conta A, do Rio. [ok]

Honras

* Mostrar as honras feitas?
* Mostrar de quando eram os empréstimos que foram pagos?

### Resolver

Tooltip passando do limite no celular
Explicações card. Explicar que o valor é o saldo em 31/12/2019. Que a tabela mostra o valor original.

Explicitar que a pessoa pode clicar nas opções para visualizar o total / por tipo / rank?




