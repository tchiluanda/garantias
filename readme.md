### Contexto

A ideia inicial é contextualizar as garantias concedidas pela União no cenário das dívidas dos entes subnacionais (Estados, Municípios e Distrito Federal). Assim, podemos segmentar o endividamento total dos entes subnacionais em três componentes:

i. a dívida com a União, decorrente do refinanciamento/renegociação/reestruturação da dívida desses entes;
ii. a dívida com instituições financeiras, sem garantia da União; e
iii. a dívida com instituições financeiras, com garantia da União mdash que é o foco principal desta história.

Definida essa segmentação, o próximo passo é buscar os dados. Aí temos o seguinte cenário:

* O Sadipem, na opção "CDP", "Baixar o cadastro completo", traz uma tabela "05-dividas-execucao-financeira" que detalha os saldos devedores nas datas-base de cada ente, para cada tipo de dívida. Em tese seria possível obter o valor (i) dessa base.

* O Siconfi traz os demonstrativos da Dívida Consolidada declarados pelos entes em seus RGF, o que permitiria obter também a informação (i). No entanto, esse valor não bate com o obtido do Sadipem.

* Por ocasião da elaboração do Boletim dos Entes Subnacionais, a equipe técnica do Tesouro faz um trabalho de batimento dos dados dos RGF com os dados do Sadipem, mas essencialmente para o Estados. Assim, os dados do boletim seriam os mais confiáveis para a informação (i). No entanto, esses dados tem uma defasagem e só se referem a Estados.





### Observações gerais

Dados apenas de mutuários: 

* Garantias totais (interna, cambial, total) -- `agrupador_total`
* ATM (avg time to maturity) -- `agrupador_atm_completo`
* Custos -- `agrupador_custo_completo` (?)
* Percentual vincendo -- `agrupador_percentual_vincendo_total`

Estão em [garantias.RData](./R/garantias.RData).

Em falta: 

* Novos contratos 
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



### Referências / inspirações

Tabelas como essa daqui:
https://pudding.cool/2018/08/wiki-death/

Print do css está no Google Docs.

Inspiração para o gráfico de bolhas:
https://archive.nytimes.com/www.nytimes.com/interactive/2012/02/13/us/politics/2013-budget-proposal-graphic.html

Tutorial do Jim:
https://vallandingham.me//bubble_charts_with_d3v4.html

Streamgraph para honras
![](streamgraph_hflip_shorter.svg)


### Páginas relacionadas dentro do site

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



### Resolver

Tooltip passando do limite no celular



