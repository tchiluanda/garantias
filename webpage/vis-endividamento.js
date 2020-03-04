const $container_endividamento = d3.select('.container-vis-endividamento');
const $svg_endividamento       = $container_endividamento.select('#vis-endividamento');

const w_bruto = $container_endividamento.node().offsetWidth;
const w_endiv = w_bruto >= 600 ? 600 : w_bruto;

const h_endiv = $container_endividamento.node().offsetHeight;

//const h = w < 510 ? 500 : 500;

const margin = {
  top: 20,
  bottom: 60,
  left: 10,
  right: 10
};

const w_liq = w_endiv - margin.left - margin.right;

$svg_endividamento     
  .attr('width', w_endiv)
  .attr('height', h_endiv);

// leitura do arquivo

d3.csv("dividas_totais.csv").then(function(dados) {
  
  // pre processa algumas coisas
  for (el of dados) {
    el.valor = +el.valor;
  }

  console.table(dados);

  // funcaozinha para gerar rotulos

  const localeBrasil = {
    "decimal": ",",
    "thousands": ".",
    "grouping": [3],
    "currency": ["R$", ""]};

  const formataBR = d3.formatDefaultLocale(localeBrasil).format(",.1f");

  const multiplos = [1, 1e3, 1e6, 1e9, 1e12];
  const sufixo    = ["", "mil", "mi", "bi", "tri"];
  const obj_mult = multiplos.map((d,i) => ({
    valor: d,
    sufixo: sufixo[i]
  }));
  console.log("objeto multiplos", obj_mult)

  const valor_formatado = function(x) {
    for (mult of obj_mult) {
      const val = x/mult.valor;
      console.log(val)
      if (val < 1000) return formataBR(val) + " " + mult.sufixo;
    }
  }

  // filtra
  const dados_total = dados.filter(d => d.Escopo != "Total" &&
                                        d.tipo_divida != "Divida_Total");

  // escala y
  const y = d3.scaleLinear()
              .range([margin.top, h_endiv - margin.bottom])
              .domain([0, d3.max(dados, d => d.valor)]); 
  
  // escala altura
  const l = d3.scaleLinear()
              .range([0, h_endiv - margin.bottom - margin.top])
              .domain([0, d3.max(dados, d => d.valor)]); 

  // escala cor
  const cor = d3.scaleOrdinal()
              .range(["#66c2a5", "#8da0cb", "#80160D", "#004D4D"])
              .domain(["Estados", "Municípios", "Total", "Destaque"]);
  
  const y_max = y(d3.max(dados, d => d.valor));     
  const l_max = l(d3.max(dados, d => d.valor));   


  // constroi uma array com os dados necessarios 
  // para a visualizacao. essa array que vai ser 
  // "amarrada" aos elementos visuais.

  const bar_width = 20;
  const dados_vis = [];

  console.table(dados_total);
  console.log("Y0", y(0), l(dados_total[0].valor));
  
  for (let i = 0; i < dados_total.length; i++) {

    const x_index = Math.floor(i/2) + 1;
    //(porque quero distribuir horizontalmente conforme o
    // tipo de divida, mas para cada tipo vou ter sempre
    // dois segmentos, "Estados" e "Municipios". então um
    // pouco de aritmética modular para gerar um novo índice que 
    // vai ser usado para determinar a posição x das barras

    dados_vis.push({
      tipo_divida: dados_total[i].tipo_divida,
      Escopo: dados_total[i].Escopo,
      x_0 : margin.left +  w_liq/4 - bar_width/2,
      x_1 : margin.left + (w_liq/4)*(4 - x_index) - bar_width/2, //(w_liq/5)*(i+1),
      height : l(dados_total[i].valor),
      valor_formatado : valor_formatado(dados_total[i].valor),
      y : i == 0 ? y(0) : dados_vis[i-1].y + l(dados_total[i-1].valor)
    })
  };

  // acrescenta as posições finais das barras
  for (el of dados_vis) {
    el.x_2 = el.x_1 + 5*bar_width/8 * (el.Escopo == "Estados" ? -1 : +1);
    el.y_2 = y_max - el.height;
  }

  console.table(dados_vis);

  // só mais um parâmetro: width
  

  // binding
  const bars = $svg_endividamento
    .selectAll("rect")
    .data(dados_vis);
  
  console.log(bars);

  $svg_endividamento.style("background-color", "cornsilk")

  // funções para desenhar

  const abertura = function() {
    //uma barrona
    $svg_endividamento
      .append("rect")
      .classed("d3--endividamento-total", true)
      .attr("x", dados_vis[0].x_0)
      .attr("y", y(0))
      .attr("height", 0)
      .attr("width", bar_width)
      .attr("stroke-width", 0)
      .attr("fill", cor("Total"))
      .transition()    
      .duration(250)
      .attr("height", l_max);

    //uma linha de referência
    $svg_endividamento
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", margin.left)
      .attr("y1", y_max)
      .attr("y2", y_max)
      .attr("stroke", "#666")
      .transition()
      .delay(250)
      .duration(200)
      .attr("x2", margin.left + w_liq);
    
    // segmentos de barrinhas
    bars.enter().append("rect")
      .classed("d3--endividamento", true)
      .attr("x", d => d.x_0)
      .attr("y", d => d.y)
      .attr("height", d => d.height)
      .attr("width", bar_width)
      .attr("stroke-width", 0)
      .attr("fill", cor("Total"));
  }

  const remove_barra_total = function() {
    d3.select(".d3--endividamento-total").remove()
  };

  const step_waterfall = function(tipo_divida, direction) {
    const bar_atual = d3.selectAll("rect.d3--endividamento").filter(d => d.tipo_divida == tipo_divida);
    console.log("barra atual", bar_atual);
    bar_atual.transition().duration(500)
    .attr("x", d => direction == "down" ? d.x_1 : d.x_0)
    .attr("fill", direction == "down" ? cor("Destaque") : cor("Total"));
  }

  const step_colore = function(direction) {
    console.log("Disparei função colore, com a direção", direction);
    if (direction == "down") {
      console.log("tô dentro do ramo direction=down")
      d3.selectAll("rect.d3--endividamento")
        .transition()
        .duration(500)
        .attr("fill", d => cor(d.Escopo));
    }
    else {
      d3.selectAll("rect.d3--endividamento")
        .transition()
        .duration(500)
        .attr("fill", cor("Destaque"));   
    }
  };

  const step_separa = function(direction) {
    d3.selectAll("rect.d3--endividamento")
      .transition()
      .duration(500)
      .attr("x", d => direction == "down" ? d.x_2 : d.x_1)
      .transition()
      .duration(500)
      .attr("y", d => direction == "down" ? d.y_2 : d.y);
  };

  abertura();
  //remove_barra_total();

  // ze SCROLLER!

  const $steps = d3.selectAll(".endividamento-steps");

  const scroller = scrollama();
  
  // setup
  scroller
    .setup({
      step: ".endividamento-steps"
    })
    .onStepEnter(response => {

      $steps.classed("step-ativo", (d, i) => (i === response.index));
      /*$steps
        .transition()
        .duration(500)
        .attr("opacity", function(d,i) {
          console.log("dentro do scroller, i, response", i, response.index)
          return (i === response.index ? 1 : 0)
        });
      //console.log("Dentro do scroller!", $steps.node()[response.index].attr("opacity"))
      */
      //const el = response.element; 
      //const stepData = el.attr("data-step");
      console.log("Step Data", response.index, response.direction);

      switch (response.index) {
        case 1:
          step_waterfall("Divida_Uniao", response.direction);
          break;
        case 2:
          step_waterfall("Divida_Garantida", response.direction);
          break;
        case 3:
          step_waterfall("Divida_demais", response.direction);
          break;  
        case 4:
          step_colore(response.direction);
          break; 
        case 5:
          step_separa(response.direction);
          break;                                  
      }
    })
    /*
    .onStepExit(response => {
      $steps.filter((d, i) => (i === response.index))
      .transition()
      .duration(200)
      .opacity(0);
    })*/


  // escutando os botões

  const botoes = d3.selectAll("nav.controls > button");

  botoes.on("click", function() {
    const step_sel = this.id;
    switch (step_sel) {
      case "step-1":
        step("Divida_Uniao");
        break;
      case "step-2":
        step("Divida_Garantida");
        break;
      case "step-3":
        step("Divida_demais");
        break;
      case "step-4":
        step_colore();
        break;          
      case "step-5":
        step_final();
        break;        
      case "step-0":
        reseta();
        break;
              

    }
  })


});