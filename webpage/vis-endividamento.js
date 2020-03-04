const $container_endividamento = d3.select('.container-vis-endividamento');
const $svg_endividamento           = $container_endividamento.select('#vis-endividamento');

const w = $container_endividamento.node().offsetWidth;
const h = w < 510 ? 500 : 500;

const margin = {
  top: 20,
  bottom: 60,
  left: 10,
  right: 10
};

const w_liq = w - margin.left - margin.right;

$svg_endividamento     
  .attr('width', w)
  .attr('height', h);

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
              .range([margin.top, h-margin.bottom])
              .domain([0, d3.max(dados, d => d.valor)]); 
  
  // escala altura
  const l = d3.scaleLinear()
              .range([0, h - margin.bottom - margin.top])
              .domain([0, d3.max(dados, d => d.valor)]); 
  
  const y_max = y(d3.max(dados, d => d.valor));     

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

  bars.enter().append("rect")
    .classed("d3--endividamento", true)
    .attr("x", d => d.x_0)
    .attr("y", d => d.y)
    .attr("height", d => d.height)
    .attr("width", bar_width)
    .attr("stroke-width", 0);

  $svg_endividamento.style("background-color", "cornsilk")

  // movimentando

  const waterfall = function(tipo_divida, direction) {
    const bar_atual = d3.selectAll("rect.d3--endividamento").filter(d => d.tipo_divida == tipo_divida);
    console.log("barra atual", bar_atual);
    bar_atual.transition().duration(500)
    .attr("x", d => direction == "down" ? d.x_1 : d.x_0)
    .style("fill", d => direction == "down" ? "goldenrod" : "#444");
  }

  const reverte_step = function(tipo_divida) {
    const bar_atual = d3.selectAll("rect").filter(d => d.tipo_divida == tipo_divida);
    console.log("barra atual", bar_atual);
    bar_atual.transition().duration(500)
    .attr("x", d => d.x_0)
    .attr("fill", "#333");
  }

  const step_colore = function() {
    d3.selectAll("rect").transition().duration(500)
      .attr("fill", d => d.Escopo == "Estados" ? "dodgerblue" : "firebrick");
  };

  const step_final = function() {
    d3.selectAll("rect")
      .transition()
      .duration(500)
      .attr("x", d => d.x_2)
      .transition()
      .duration(500)
      .attr("y", d => d.y_2);
  };




  const reseta = function() {
    d3.selectAll("rect").transition().duration(500)
    .attr("x", d => d.x_0)
    .attr("y", d => d.y)
    .attr("fill", "#333");
  }

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
          waterfall("Divida_Uniao", response.direction);
          break;
        case 2:
          waterfall("Divida_Garantida", response.direction);
          break;
        case 3:
          waterfall("Divida_demais", response.direction);
          break;          
      }
  


      console.log("Dentro do scroller, el:", el);

    })


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