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

// configures svg dimensions
$svg      
  .attr('width', w)
  .attr('height', h);

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

// the bubbleChart

const bubbleChart = function() {

  // Original Jim's comments are marked below (with a "JV:").

  // JV: @v4 strength to apply to the position forces
  const forceStrength = 0.03;

  // JV: These will be set in create_nodes and create_vis
  var svg = null;
  var bubbles = null;
  var nodes = [];

  // JV all the way down
  // Charge function that is called for each node.
  // As part of the ManyBody force.
  // This is what creates the repulsion between nodes.
  //
  // Charge is proportional to the diameter of the
  // circle (which is stored in the radius attribute
  // of the circle's associated data.
  //
  // This is done to allow for accurate collision
  // detection with nodes of different sizes.
  //
  // Charge is negative because we want nodes to repel.
  // @v4 Before the charge was a stand-alone attribute
  //  of the force layout. Now we can use it as a separate force!

  const charge = function(d) {
    return -Math.pow(d.radius, 2.0) * forceStrength;
  }

  // JV: Here we create a force layout and
  // JV: @v4 We create a force simulation now and
  // JV: add forces to it.
  const simulation = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(forceStrength).x(center.x))
    .force('y', d3.forceY().strength(forceStrength).y(center.y))
    .force('charge', d3.forceManyBody().strength(charge))
    .on('tick', ticked);

  // JV: @v4 Force starts up automatically,
  // JV: which we don't want as there aren't any nodes yet.
  simulation.stop();

}

// function to process the data



// read data

d3.csv("webpage/dados_vis.csv", function(d) {
    return {
        classificador: d.Classificador,
        entidade: d.Inicio,
        valor: +d.valor,
        valor_classificador: +d.total_classificador,
        rank_geral: +d.rank_geral,
        rank_classificador: +d.rank_classificadores,
        x: Math.random() * w,
        y: Math.random() * h
    }
}).then(function(dados) {
    console.table(dados);
    // scales

    const fillColor = d3.scaleOrdinal()
      .domain(lista_tipos)
      .range(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"]);

    const maxValue = d3.max(dados, d => +d.valor);

    const radiusScale = d3.scaleSqrt()
      .range([0, 35])
      .domain([0, maxValue]);
    
    // Jim uses a function to create the nodes, i.e., the 
    // data array. Here the data comes from d3.csv as "dados"
    // to this current function.

    // JV: sort them to prevent occlusion of smaller nodes.
    dados.sort((a,b) => b.valor - a.valor);

    


})