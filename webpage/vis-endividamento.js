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

  // filtra, gera uma versão "objetificada"

  const dados_total = dados.filter(d => d.Escopo != "Total" &&
                                        d.tipo_divida != "Divida_Total");
  const dados_flat = {};
  for (el of dados) {
    dados_flat[el.tipo_divida] = el.valor;
  }

  console.log(dados_flat);

  // escala y
  const y = d3.scaleLinear()
              .range([margin.top, h-margin.bottom])
              .domain([0, d3.max(dados, d => d.valor)]); 
  
  // escala altura
  const l = d3.scaleLinear()
              .range([0, h - margin.bottom - margin.top])
              .domain([0, d3.max(dados, d => d.valor)]); 
              
  // constroi uma array com os dados necessarios 
  // para a visualizacao. essa array que vai ser 
  // "amarrada" aos elementos visuais.

  /* comecei fazendo na mão:

  const dados_vis = [
    {
      tipo_divida: "Divida_Total",
      x : margin.left + (w_liq*1)/5,
      y : y(0),
      height: dados_flat[]
    }, ...
  ]

  mas dá pra automatizar, em termos: */
  const bar_width = 16;
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
      y : i == 0 ? y(0) : dados_vis[i-1].y + l(dados_total[i-1].valor)
    })
  };

  console.table(dados_vis);

  // só mais um parâmetro: width
  

  // binding
  const bars = $svg_endividamento
    .selectAll("rect")
    .data(dados_vis);
  
  console.log(bars);

  bars.enter().append("rect")
    .attr("x", d => d.x_0)
    .attr("y", d => d.y)
    .attr("height", d => d.height)
    .attr("width", bar_width)
    .attr("stroke-width", 0);

  $svg_endividamento.style("background-color", "cornsilk")

  // movimentando

  const step = function(tipo_divida) {
    const bar_atual = d3.selectAll("rect").filter(d => d.tipo_divida == tipo_divida);
    console.log("barra atual", bar_atual);
    bar_atual.transition().duration(500)
    .attr("x", d => d.x_1)
    .attr("fill", "goldenrod");
  }

  const reverte_step = function(tipo_divida) {
    const bar_atual = d3.selectAll("rect").filter(d => d.tipo_divida == tipo_divida);
    console.log("barra atual", bar_atual);
    bar_atual.transition().duration(500)
    .attr("x", d => d.x_0)
    .attr("fill", "goldenrod");
  }


  const reseta = function() {
    d3.selectAll("rect").transition().duration(500)
    .attr("x", d => d.x_0)
    .attr("fill", "#333");
  }

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
      case "step-0":
        reseta();
        break;
              

    }
  })


});