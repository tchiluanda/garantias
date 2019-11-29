// capture some important references
const $grafico_container = d3.select('.grafico-d3-container');
const $svg     = $grafico_container.select('.grafico-d3-svg');

// I will define the margins of the plot area in terms of a "PAD". 
// Sorry, Mike.
//const PAD = 40;

// captures the container's width
// and uses it as the svg width
// -> learnt that with @codenberg
const w = $grafico_container.node().offsetWidth;
console.log("Largura do container: ", w);

// defines h based on the width
const h = w < 510 ? 400 : 600;

// center of the plot
const center = { x: w / 2, y: h / 2 };

// layouts for the display by type option
const ncol_tipos = w < 510 ? 2 : 3;

const ncol_rank = w < 510 ? 2 : 4;

// lists/arrays with the two categories that will be used
// as criteria for spreading out the bubbles
const lista_tipos = ["Estados", "Bancos Federais", "Municípios", "Estatais Federais", 
"Entidades Estaduais Controladas", "Empresas Privatizadas"];

const lista_rank = d3.range(16).map(d => d+1);

// a function that returns an object with the centers of the
// bubbles "clusters"
const generate_centers = function(list, ncol) {
    const obj = {}
    list.forEach(function(d,i) {
      nrow = Math.ceil(list.length / ncol);
      coord_i = i % ncol;
      coord_j = Math.floor(i/ncol)
      return (obj[d] = {
              x: w/(ncol*2) + (w*coord_i)/ncol,
              y: h/(nrow*2) + (h*coord_j)/nrow
              })
    });
    return obj;  
}

// read data

d3.csv("webpage/dados_vis.csv", function(d) {
    return {
        classificador: d.Classificador,
        entidade: d.Inicio,
        valor: +d.valor,
        valor_classificador: +d.total_classificador,
        rank_geral: +d.rank_geral,
        rank_classificador: +d.rank_classificadores
    }
}).then(function(dados) {
    console.table(dados);
})