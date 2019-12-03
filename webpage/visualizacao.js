// capture some important references
const $grafico_container = d3.select('.grafico-d3-container');
const $svg     = $grafico_container.select('.grafico-d3-svg');
const qde_rank = 20

// I will define the margins of the plot area in terms of a "PAD". 
// Sorry, Mike.
//const PAD = 40;

// captures the container's width
// and uses it as the svg width
// -> learnt that with @codenberg
const w = $grafico_container.node().offsetWidth;
console.log("Largura do container: ", w);

// defines h based on the width
const h = w < 510 ? 500 : 700;

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

const lista_rank = d3.range(qde_rank-1).map(d => d+1);
lista_rank.push("Demais");

// a function that returns an object with the coordinates and parameters
// of the bubbles "clusters"

const PAD = 15;

const generate_groups_coordinates = function(list, ncol) {  
  nrow = Math.ceil(list.length / ncol);  
  const obj = {
    cols: ncol,
    rows: nrow,
    w_cell: w / ncol,
    h_cell: h / nrow - 2*PAD
  }
  list.forEach(function(d,i) {     
    coord_i = i % ncol;
    coord_j = Math.floor(i/ncol)
    return (obj[d] = {
            x_cell: w/(ncol*2) + (w*coord_i)/ncol,
            y_cell: h/(nrow*2) + (h*coord_j)/nrow
            })
  });
  return obj;  
}

// populate objects
const tipos = generate_groups_coordinates(lista_tipos, ncol_tipos);
const ranks = generate_groups_coordinates(lista_rank, ncol_rank);

console.log("Ranks: ", ranks);

// function to format the values

// formatação valores
    
const localeBrasil = {
    "decimal": ",",
    "thousands": ".",
    "grouping": [3],
    "currency": ["R$", ""]};

const formataBR = d3.formatDefaultLocale(localeBrasil).format(",.0f");

const formata_vlr_tooltip = function(val){
    return "R$ "+formataBR(val/1e6)+" mi"
}

// scales: color

const fillColor = d3.scaleOrdinal()
  .domain(lista_tipos)
  .range(["#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f"]);

// *************************************************************
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


// ###############################################################
// read data
// ###############################################################
// will include random generated values for x and y so 
// the bubble will have a (random) start position, before
// the force layout starts to act.

d3.csv("webpage/dados_vis.csv", function(d) {
    return {
        classificador: d.Classificador,
        entidade: d.Inicio,
        valor: +d.valor,
        valor_classificador: +d.total_classificador,
        rank_geral: +d.rank_geral < qde_rank ? +d.rank_geral : "Demais",
        rank_classificador: +d.rank_classificadores,
        x: Math.random() * w,
        y: Math.random() * h
    }
}).then(function(dados) {

    // scales

    const maxValue = d3.max(dados, d => +d.valor);

    const radiusScale = d3.scaleSqrt()
      .range([0, 35])
      .domain([0, maxValue]);
    
    // Jim uses a function to create the nodes, i.e., the 
    // data array. Here the data comes from d3.csv as "dados"
    // to this current function.

    // JV: sort them to prevent occlusion of smaller nodes.
    dados.sort((a,b) => b.valor - a.valor);

    console.table(dados);

    // cria objetos para posicionar os rótulos

    const subtotals = d3.map(dados, d => d.valor_classificador).keys();
    const classificadores = d3.map(dados, d => d.classificador).keys();

    const labels_tipos_com_valores = [];
    classificadores.forEach(
      (d, i) => labels_tipos_com_valores[i] = {
        classificador: d,
        value: subtotals[i],
        x_label : tipos[d].x_cell - tipos.w_cell/2,
        y_label : tipos[d].y_cell + tipos.h_cell/2,
        w_label : tipos.w_cell
      }
    );

    const labels_ranks_com_valores = [];
    lista_rank.forEach(
      (d, i) => labels_ranks_com_valores[i] = {
        rank: d == "Demais" ? d : d + ". " + dados[i].entidade, // (1)
        tipo: d == "Demais" ? "" : dados[i].classificador,
        value: d == "Demais" ? "" : dados[i].valor, // (1)
        x_label : ranks[d].x_cell - ranks.w_cell/2,
        y_label : ranks[d].y_cell + ranks.h_cell/2,
        w_label : ranks.w_cell
      }
    );

    // (1) aqui me aproveito do fato de que os dados 
    // foram ordenados (linha 172), senão teria que fazer um
    // tratamento aqui

    console.log(labels_tipos_com_valores)
    console.log(labels_ranks_com_valores)


    // Bind nodes data to what will become DOM 
    // elements to represent them.
    // using a key function with "entidade" + "classificador"
    // because there are two cases of "entidade" that repeat
    // themselves, with different "classificador" ("Sao Paulo" and
    // "Rio de Janeiro", which are both States and Municipalities)
    let bubbles = $svg.selectAll(".bubble")
      .data(dados, d => d.entidade + d.classificador);

    let bubbles_enter = bubbles.enter().append("circle")
      .classed("bubble", true)
      .attr("r", d=>radiusScale(d.valor))
      .attr("fill", d => fillColor(d.classificador))
      .attr("stroke", d => d3.rgb(fillColor(d.classificador)).darker())
      .attr("stroke-width", 2)
      .attr("cx", function(d) {
        if (d.x + radiusScale(d.valor) > w) return (w - radiusScale(d.valor) - 2)
        else if (d.x - radiusScale(d.valor) < 0) return (radiusScale(d.valor) + 2)
        else return d.x
        })
      .attr("cy", function(d) {
        if (d.y + radiusScale(d.valor) > h) return (h - radiusScale(d.valor) - 2)
        else if (d.y - radiusScale(d.valor) < 0) return (radiusScale(d.valor) + 2)
        else return d.y
        })
      .on('mouseover', showTooltip)
      .on('mouseout',  hideTooltip)

    bubbles = bubbles.merge(bubbles_enter); // precisa?
  

    const nav_buttons = d3.selectAll("nav.controle-vis > button");

    nav_buttons.on("click", function(){
      console.log("Cliquei em ", this, this.id);
      
      const vis_option = this.id;

      nav_buttons.classed("selected", false);
      d3.select(this).classed("selected", true);

      const show_labels = function(list) {


      }

      switch (vis_option){

        case "geral":
          
          $grafico_container.selectAll("div.label").remove()

          bubbles.transition().duration(1000)
            .attr("cx", function(d) {
              if (d.x + radiusScale(d.valor) > w) return (w - radiusScale(d.valor) - 2)
              else if (d.x - radiusScale(d.valor) < 0) return (radiusScale(d.valor) + 2)
              else return d.x
              })
            .attr("cy", function(d) {
              if (d.y + radiusScale(d.valor) > h) return (h - radiusScale(d.valor) - 2)
              else if (d.y - radiusScale(d.valor) < 0) return (radiusScale(d.valor) + 2)
              else return d.y
              })
          break;

        case "tipo":

          //labels

          $grafico_container.selectAll("div.label").remove()

          const labels_tipos = $grafico_container.selectAll("div.label")
            .data(labels_tipos_com_valores)
            .enter()
            .append("div")
            .classed("label", true)
            .style('left', d => d.x_label + 'px')
            .style('top', d => d.y_label + 'px')
            .style('width', d => d.w_label + 'px')
            .style('opacity', 0);

          labels_tipos.transition().duration(1000).style('opacity', 1);

          labels_tipos
            .append("p")
            .append("strong")
            .text(d => d.classificador)
            .style("color", d => fillColor(d.classificador));

          labels_tipos
            .append("p")
            .classed("valor", true)
            .text(d => formata_vlr_tooltip(d.value));

          // move the bubbles

          bubbles.transition().duration(1000)
            .attr("cx", d => d.x*tipos.w_cell/w + tipos[d.classificador].x_cell - tipos.w_cell/2)
            .attr("cy", d => d.y*tipos.h_cell/h + tipos[d.classificador].y_cell - tipos.h_cell/2);
          break;

        case "rank":

          //labels

          $grafico_container.selectAll("div.label").remove()

          const labels_ranks = $grafico_container.selectAll("div.label")
            .data(labels_ranks_com_valores)
            .enter()
            .append("div")
            .classed("label", true)
            .style('left', d => d.x_label + 'px')
            .style('top', d => d.y_label + 'px')
            .style('width', d => d.w_label + 'px')
            .style('opacity', 0);

          labels_ranks.transition().duration(1000).style('opacity', 1);

          labels_ranks
            .append("p")
            .append("strong")
            .text(d => d.rank)
            .style("color", d => fillColor(d.tipo));

          labels_ranks
            .append("p")
            .text(d => d.tipo)
            .classed("tipo", true)            
            .style("color", d => fillColor(d.tipo));

          labels_ranks
            .append("p")
            .classed("valor", true)
            .text(d => formata_vlr_tooltip(d.value));

          // move the bubbles

          bubbles.transition().duration(1000)
            .attr("cx", d => d.rank_geral == "Demais" ? d.x*ranks.w_cell/w + ranks[d.rank_geral].x_cell - ranks.w_cell/2 : ranks[d.rank_geral].x_cell)
            .attr("cy", d => d.rank_geral == "Demais" ? d.y*ranks.h_cell/h + ranks[d.rank_geral].y_cell - ranks.h_cell/2 : ranks[d.rank_geral].y_cell);

          break;
      }

      




    })
});


const showTooltip = function(d) {

    let pos_x = +d3.select(this).attr('cx');
    let pos_y = +d3.select(this).attr('cy');

    const $tooltip = d3.select("#tooltip");

    const tt_fill = d3.rgb(fillColor(d.classificador)).brighter(2);
    const tt_color  = d3.rgb(fillColor(d.classificador)).darker();

    console.log("Estou na tooltip", this, d, d["entidade"]);
    
    let tooltip_width_style = $tooltip.style("width");
    let tooltip_width = +tooltip_width_style.substring(0, tooltip_width_style.length-2);
    
    console.log("Largura: ", tooltip_width);

    // show tooltip
    $tooltip.classed("hidden", false);

    // populate tooltip information

    // $tooltip.select("#tolltip-entidade").text(d[entidade])
    // hmm better use a loop.
    const infos_tooltip = ["entidade", "classificador", "valor"];

    infos_tooltip.forEach(function(info) {
        let text = "";
        if (info == "valor") text = formata_vlr_tooltip(d[info])
        else text = d[info];
        $tooltip.select("#tooltip-"+info).text(text);
    })

    // now that the content is populated, we can capture the tooltip
    // height, so that we can optime the tt position.

    const tooltip_height = $tooltip.node().getBoundingClientRect().height;
    console.log(tooltip_height);

    // calculate positions

    const pad = 10;

    if (pos_x + tooltip_width + pad > w) {
        pos_x = pos_x - tooltip_width - pad;
    } else {
        pos_x = pos_x + pad
    }

    if (pos_y + tooltip_height + pad > h) {
        pos_y = pos_y - tooltip_height - pad;
    } else {
        pos_y = pos_y + pad
    }

    $tooltip
      .style('left', pos_x + 'px')
      .style('top', pos_y + 'px')
      .style('color', tt_color)
      .style('border-color', tt_color)
      .style('background-color', tt_fill);
}

const hideTooltip = function(d) {
    d3.select("#tooltip").classed("hidden", true);
}