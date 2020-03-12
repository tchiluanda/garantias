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
//console.log("Largura do container: ", w);

// defines h and the number of itens in the rank
//  based on the width

const h = w < 510 ? 500 : 500;
const qde_rank = w < 510 ? 9 : 21;

// configures svg dimensions
$svg      
  .attr('width', w)
  .attr('height', h*1.1);

// center of the plot
const center = { x: w / 2, y: h / 3 };

// layouts for the display by type option
const ncol_tipos = w < 510 ? 2 : 3;

const ncol_rank = w < 510 ? 2 : 5;

// lists/arrays with the two categories that will be used
// as criteria for spreading out the bubbles
const lista_tipos = ["Estados", "Bancos Federais", "Municipios", "Entidades Estaduais Controladas", "Estatais Federais"];

const lista_rank = d3.range(qde_rank-1).map(d => d+1);
lista_rank.push("Demais");

// a function that returns an object with the coordinates and parameters
// of the bubbles "clusters"

const generate_groups_coordinates = function(list, ncol) {  
  nrow = Math.ceil(list.length / ncol);  
  const obj = {
    cols: ncol,
    rows: nrow,
    w_cell: w / ncol,
    h_cell: h / nrow // (1)
  }
  const elementos_sobrando = list.length % ncol;
  const ajuste = (ncol - elementos_sobrando) * (obj.w_cell/2);
  console.log("ajuste", ajuste)

  list.forEach(function(d,i) {     
    coord_i = i % ncol;
    coord_j = Math.floor(i/ncol);
    const pad = (elementos_sobrando > 0) & (coord_j + 1 == nrow) ? ajuste : 0;

    return (obj[d] = {
            x_cell: d == "Demais" ? w/2 : w/(ncol*2) + (w*coord_i)/ncol + pad,
            y_cell: h/(nrow*2) + (h*coord_j)/nrow,
            line_number: coord_j
            })
  });
  return obj;  
}
  // (1) Here I calculate the "cell" dimensions, but in this way
  //     they will be always of the same size. I'll try to set the
  //     height proportionally to the total amount of the group

// populate objects
const tipos = generate_groups_coordinates(lista_tipos, ncol_tipos);
const ranks = generate_groups_coordinates(lista_rank, ncol_rank);

//console.log("Ranks: ", ranks);
console.log("Tipos: ", tipos);

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


// function to process the data


// ###############################################################
// read data
// ###############################################################
// will include random generated values for x and y so 
// the bubble will have a (random) start position, before
// the force layout starts to act.

d3.csv("webpage/dados_vis_garantias.csv", function(d) {
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
      .range([2, w < 510 ? w/13 : 35])  // 45
      .domain([0, maxValue]);
    
    // Jim uses a function to create the nodes, i.e., the 
    // data array. Here the data comes from d3.csv as "dados"
    // to this current function.

    // JV: sort them to prevent occlusion of smaller nodes.
    dados.sort((a,b) => b.valor - a.valor);

    //console.table(dados);

    // #############################################
    // cria objetos para posicionar os rótulos
    // e funções para gerar os rótulos

    // total demais
    let demais = 0;
    dados.forEach(function(d) {
      if (d.rank_geral == "Demais")
        demais += d.valor;
    });
    //console.log(demais);

    /*
    // function to evaluate subtotals
    const subtotais = function(data, criteria, categorical_variable, value_variable) {
      let subtotal = 0;
      data.forEach(function(d) {
        if (d[categorical_variable] == criteria)
          subtotal += d[value_variable];
      });
      return subtotal;
    }

    const tipos_with_subtotals = []
    lista_tipos.forEach((element) => tipos_with_subtotals.push(
      { tipo  : element,
        valor : subtotais(dados, element, "classificador", "valor")}
    ))

    console.table(tipos_with_subtotals); */

    // total geral
    const total = dados
      .map(d => d.valor)
      .reduce((cum_value, current_value) => cum_value + current_value);
    //console.log("total geral: ", total);

    // para os tipos

    const subtotals = d3.map(dados, d => d.valor_classificador).keys();
    const classificadores = d3.map(dados, d => d.classificador).keys();
    console.log(classificadores, "classificadores")
    console.log("tipos", tipos)

    const labels_tipos_com_valores = [];
    classificadores.forEach(
      (d, i) => {console.log(d);labels_tipos_com_valores[i] = {
        classificador: d,
        value: subtotals[i],
        x_label : tipos[d].x_cell - tipos.w_cell/2,
        //y_label : tipos[d].y_cell + tipos.h_cell/2 - 50,
        w_label : tipos.w_cell,
        line_number : tipos[d].line_number
      }}
    );

    const linhas_tipos = d3.map(labels_tipos_com_valores, d => d.line_number).keys();
 
    const tipos_parametros_linhas = [];
    let total_tamanhos_maximos = 0;  
    const altura_rotulo = 50;

    linhas_tipos.forEach(function(linha) {
      let tamanhos_linha = 
        labels_tipos_com_valores
          .filter(el => el.line_number == linha)
          .map(el => radiusScale(+el.value) + altura_rotulo)

      //console.log("To no loop, valores da linha ", linha, ": ", tamanhos_linha);
      
      let max_tamanho_linha = +d3.max(tamanhos_linha);
      total_tamanhos_maximos += max_tamanho_linha;

      tipos_parametros_linhas.push(
        {line_number : linha,
         tamanho_maximo : max_tamanho_linha}
      );  
    })

    let y_inicial = 0
    tipos_parametros_linhas.forEach(
      function(element) {
        element.proporcao = element.tamanho_maximo / total_tamanhos_maximos;
        element.height = h * element.proporcao;
        element.center = element.height/2 + y_inicial - altura_rotulo*0.75;
        y_inicial += element.height;
        element.y_label = y_inicial - altura_rotulo;
      })

    labels_tipos_com_valores.forEach(
      function(element) {
        element.y_label = tipos_parametros_linhas[element.line_number].y_label;
      }
    )



    const labels_ranks_com_valores = [];
    lista_rank.forEach(
      (d, i) => labels_ranks_com_valores[i] = {
        rank: d == "Demais" ? d : d + ". " + dados[i].entidade, // (1)
        tipo: d == "Demais" ? "" : dados[i].classificador,
        value: d == "Demais" ? demais : dados[i].valor, // (1)
        x_label : ranks[d].x_cell - ranks.w_cell/2,
        y_label : d == "Demais" ? ranks[d].y_cell + ranks.h_cell/2 : ranks[d].y_cell + ranks.h_cell/2 - 30,
        w_label : ranks.w_cell
      }
    );

    // (1) aqui me aproveito do fato de que os dados 
    // foram ordenados (linha 172), senão teria que fazer um
    // tratamento aqui

    //console.log("labels_tipos_com_valores", labels_tipos_com_valores)
    //console.log("tipos", tipos);
    //console.log("Linhas e valores máximos ", tipos_parametros_linhas);
    //console.log(labels_ranks_com_valores)

    // ####################
    // labels

    const remove_labels = function() {
      $grafico_container.selectAll("div.label").remove()
    }
    const show_label_geral = function() {
      const labels_geral = $grafico_container.append("div")
        .classed("label", true)
        .style('left', '0px')
        .style('top', 0.6*h + 'px')
        .style('width', w + 'px')
        .style('opacity', 0);

      labels_geral.transition().duration(1000).style('opacity', 1);

      labels_geral
        .append("p")
        .append("strong")
        .text("Total de Garantias")
        .style("font-size", "1.5em")
        .style("color", "#004D4D");

      labels_geral
        .append("p")
        .append("strong")
        .text("concedidas pela União")
        .style("font-size", "1.5em")
        .style("color", "#004D4D");

      labels_geral
        .append("p")
        .classed("valor", true)
        .style("font-size", "1.25em")
        .text(d => formata_vlr_tooltip(total));
    }

    const show_labels_groups = function() {
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
    }

    const show_labels_rank = function() {
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
        .classed("texto-rank", true) 
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
        .text(d => d == "Demais" ? "" : formata_vlr_tooltip(d.value));             
    }


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
      .attr("r", 0)
      .attr("fill", d => fillColor(d.classificador))
      .attr("stroke", d => d3.rgb(fillColor(d.classificador)).darker())
      .attr("stroke-width", 2)
      .on('mouseover', showTooltip)
      .on('mouseout',  hideTooltip)

    bubbles = bubbles.merge(bubbles_enter); // precisa?

    bubbles.transition()
      .duration(2000)
      .attr("r", d=>radiusScale(d.valor));

    // #####################
    // simulacao
    // *************************************************************

    // Original Jim's comments are marked below (with a "JV:").

    // JV: @v4 strength to apply to the position forces
    const forceStrength = 0.03;

    // JV: These will be set in create_nodes and create_vis
    // JV all the way down
    // Charge function that is called for each node.
    // As part of the ManyBody force.
    // This is what creates the repulsion between nodes.
    //
    // Charge is proportional to the diameter of the
    // circle (which is stored in the radius attribute
    // of the circle's associated data).
    //
    // This is done to allow for accurate collision
    // detection with nodes of different sizes.
    //
    // Charge is negative because we want nodes to repel.
    // @v4 Before the charge was a stand-alone attribute
    //  of the force layout. Now we can use it as a separate force!

    const charge = function(d) {
      return -Math.pow(radiusScale(d.valor), 2.0) * forceStrength;
    }

    const ticked = function() {
      bubbles
        .attr('cx', function (d) { return d.x; })
        .attr('cy', function (d) { return d.y; });
    }

    // Set the simulation's nodes to our newly created nodes array.
    // @v4 Once we set the nodes, the simulation will start running automatically!

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

    // fim simulacao
    // #####################

    simulation.nodes(dados);

    const geral = function() {    
      // @v4 Reset the 'x' force to draw the bubbles to the center.
      simulation.force('x', d3.forceX().strength(forceStrength).x(center.x));
      simulation.force('y', d3.forceY().strength(forceStrength).y(center.y));
    
      // @v4 We can reset the alpha value and restart the simulation
      simulation.alpha(1).restart();
    }

    geral();
    show_label_geral();

    // #######################
    // interatividade

    const nav_buttons = d3.selectAll("nav.controle-vis > button");

    nav_buttons.on("click", function(){

      //console.log("Cliquei em ", this, this.id);
      
      const vis_option = this.id;

      nav_buttons.classed("selected", false);
      d3.select(this).classed("selected", true);

      switch (vis_option){

        case "geral":
          //console.log("Tô aqui no Geral.")
          remove_labels();
          show_label_geral();
          // @v4 Reset the 'x' force to draw the bubbles to the center.
          simulation.force('x', d3.forceX().strength(forceStrength).x(d => center.x));
          simulation.force('y', d3.forceY().strength(forceStrength).y(d => center.y));
        
          // @v4 We can reset the alpha value and restart the simulation
          simulation.alpha(1).restart();
          break;

        case "tipo":

          //labels
          remove_labels();
          show_labels_groups();          

          // move the bubbles
          // @v4 Reset the 'x' force to draw the bubbles to their year centers
          simulation.force('x', d3.forceX().strength(forceStrength).x(d => tipos[d.classificador].x_cell));
          simulation.force('y', d3.forceY().strength(forceStrength).y(d => tipos_parametros_linhas[tipos[d.classificador].line_number].center));
      
          // @v4 We can reset the alpha value and restart the simulation
          simulation.alpha(1).restart();

          break;

        case "rank":

          //labels

          remove_labels();
          show_labels_rank(); 

          // move the bubbles

          // @v4 Reset the 'x' force to draw the bubbles to their year centers
          simulation.force('x', d3.forceX().strength(d => d.rank_geral == "Demais" ? 0.0125 : forceStrength).x(d => ranks[d.rank_geral].x_cell));
          simulation.force('y', d3.forceY().strength(forceStrength).y(d => ranks[d.rank_geral].y_cell));
      
          // @v4 We can reset the alpha value and restart the simulation
          simulation.alpha(1).restart();     
          /*     

          bubbles.transition().duration(1000)
            .attr("cx", d => d.rank_geral == "Demais" ? d.x*ranks.w_cell/w + ranks[d.rank_geral].x_cell - ranks.w_cell/2 : ranks[d.rank_geral].x_cell)
            .attr("cy", d => d.rank_geral == "Demais" ? d.y*ranks.h_cell/h + ranks[d.rank_geral].y_cell - ranks.h_cell/2 : ranks[d.rank_geral].y_cell);
            */

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

    //console.log("Estou na tooltip", this, d, d["entidade"]);
    
    let tooltip_width_style = $tooltip.style("width");
    let tooltip_width = +tooltip_width_style.substring(0, tooltip_width_style.length-2);
    
    //console.log("Largura: ", tooltip_width);

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
    //console.log(tooltip_height);

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
