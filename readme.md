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

### Referências

Tabelas como essa daqui:
https://pudding.cool/2018/08/wiki-death/

Print do css está no Google Docs.

Inspiração para o gráfico de bolhas:
https://archive.nytimes.com/www.nytimes.com/interactive/2012/02/13/us/politics/2013-budget-proposal-graphic.html

Tutorial do Jim:
https://vallandingham.me//bubble_charts_with_d3v4.html

Streamgraph para honras
![](stream.svg)

### Resolver

Tooltip passando do limite no celular



