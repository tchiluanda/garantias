const $container_honras = d3.select('.container-vis-honras');
const $svg_honras       = $container_honras.select('#vis-honras');
const $steps_honras     = d3.selectAll(".honras-steps");
const scroller_honras   = scrollama();

// municipios #f8ac08
// estados #028063

let stepH, w_bruto, w_honras, h_bruto, h_honras, container_margem_superior, offset_calc;

// o que fez funcionar no celular foi esse código para ficar
// recalculando as dimensões, conforme o tamanho da janela
// do navegador.

function handleResize() {
  // ajusta tamanho do step conforme código do Russell
  // tava com problema no mobile, a imagem estava subindo além
  // do que eu queria. 
  // aí usei esse exemplo do Russell
  // https://russellgoldenberg.github.io/scrollama/sticky-side/
  
  // 1. update height of step elements
  stepH = Math.floor(window.innerHeight * 0.8);
  $steps_honras.style("height", stepH + "px");

  w_bruto = $container_honras.node().offsetWidth;
  w_honras = w_bruto >= 600 ? 600 : w_bruto;

  //const h_bruto = $container_endividamento.node().offsetHeight;
  h_bruto = window.innerHeight * 0.8
  h_honras = h_bruto //>= 500 ? 500 : h_bruto;

  container_margem_superior = (window.innerHeight - h_honras)/2;
  $container_honras
    .style("top", container_margem_superior + "px")
    .style("height", h_honras + "px");

  offset_calc = Math.floor(window.innerHeight * 0.5) + "px";

  // 3. tell scrollama to update new element dimensions
  scroller_honras.resize();
}

handleResize();

// calculada a altura do "viewport", preciso definir as alturas
// dos elementos que dependem desse valor.
// como defini como uma variável, vou atualizar simplesmente
// essa variável aqui.
//d3.select(":root").style("--altura-honras", h_endiv + "px");

//console.log("Topper", container_margem_superior, $container_endividamento.style("top"));

const margin_honras = {
  top: 20,
  bottom: 60,
  left: w_honras < 600 ? 2 : 10,
  right: w_honras < 600 ? 2 : 10
};

const w_liq_honras = w_honras - margin_honras.left - margin_honras.right;

$svg_honras     
  .attr('width', w_honras)
  .attr('height', h_honras);

// leitura do arquivo

Promise.all([
  d3.csv("dados/dados_honras_agg.csv"),
  d3.csv("dados/dados_honras_det.csv"),
]).then(function(files) {
  // files[0] will contain file1.csv
  // files[1] will contain file2.csv

  const honras_agg = files[0];

  //para formatar os valores
  for (el of honras_agg) {
    el.valor_acum = +el.valor_acum;
    el.valor_mes = +el.valor_mes;
    el.qde = +el.qde;
    el.data_mes = d3.timeParse("%Y-%m-%d")(el.data_mes);
  }

  //let teste = honras_agg.slice(0,10);
  //console.log(honras_agg[0]);
  //console.table(files[1]);


  //gera um série para cada categoria de mutuário (mutuario_cat)
  //e tipo de valor 
  const gera_series_formato_stack = function(dados, categoria, tipo_valor, lista_datas) {
    //obtem uma lista unica das categorias selecionadas
    const lista_categorias = d3.map(dados, d => d[categoria]).keys();
    console.log(lista_categorias);
    
    //inicializa o objeto que vai receber as series
    const obj_series = {};

    //para cada categoria daquela lista
    for (cat of lista_categorias) {
      // gera uma array filtrada
      const dados_filtrados = dados.filter(d => d[categoria] == cat);
      
      // o problema é que as arrays vão ter tamanhos
      // diferentes, pq nem todas as categorias apresentam
      // valores para todos os meses. então vamoms gerar,
      // para cada categoria, um objeto série com pares
      // data : valor_desejado

      // se tiver certeza que as arrays terão o mesmo tamanho,
      // poderia simplesmente combinar esses arrays com um loop mais simples

      const dados_filt_obj = {};

      for (el of dados_filtrados) {
        dados_filt_obj[el.data_mes] = el[tipo_valor];
      }
      // leva esse objeto série criado para o objetão que
      // guarda todas as séries
      obj_series[cat] = dados_filt_obj;
    }

    const serie = [];

    // aquele momento em q vc percebe q está fazendo 
    // algo tão complexo e sabe que nunca mais vai 
    // conseguir entender o que foi feito aqui... :/
    // era (bem) mais fácil ter gerado três csv's já arrumadinhos
    // no R...

    for (data of lista_datas) {
      const elemento = {};
      elemento["data_mes"] = data;
      for (cat of lista_categorias) {
        elemento[cat] = obj_series[cat][data];
      }
      serie.push(elemento)
    }

    return(serie)
    // console.log(series);
  }

  // obtem uma lista de datas
  const lista_datas = d3.map(honras_agg, d => d.data_mes).keys();

  const serie_acum = gera_series_formato_stack(honras_agg, "mutuario_cat", "valor_acum", lista_datas);
  const serie_mes  = gera_series_formato_stack(honras_agg, "mutuario_cat", "valor_mes",  lista_datas);
  const serie_qde = gera_series_formato_stack(honras_agg, "mutuario_cat", "qde", lista_datas);

  //console.table(serie_acum);
  //console.table(serie_mes);
  //console.table(serie_qde);

  // definindo a ordem das categorias
  const categorias = ["Estado do Rio de Janeiro", "Minas Gerais", "Demais entes"];

  // cria a função de stack com essa lista de categorias
  const stack = d3.stack()
    .keys(categorias)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);
  
  // cria as versões stacked das series
  const serie_acum_stack = stack(serie_acum);
  const serie_mes_stack = stack(serie_mes);
  const serie_qde_stack = stack(serie_qde);

  console.log(serie_acum_stack, serie_mes_stack, serie_qde_stack)



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

  //////////
  // constroi uma array com os dados necessarios 
  // para a visualizacao. essa array que vai ser 
  // "amarrada" aos elementos visuais.

  const bar_width = 20;

  const dados_vis = [];

  console.table(dados_total);
  //console.log("Y0", y(0), l(dados_total[0].valor));
  
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
      x_0 : margin.left +  w_liq_honras/4 - bar_width/2,
      x_1 : margin.left + (w_liq_honras/4)*(4 - x_index) - bar_width/2, //(w_liq_honras/5)*(i+1),
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


  //////////
  // agora um objeto para os rótulos
  // vou implementar os rotulos como um função que é
  // chamada e inclui o rótulo equivalente ao id na hora.
  const tipos_dividas = {
    "Divida_Total" : "Dívida Total de Estados e Municípios",
    "Divida_Uniao" : "Dívida com a União",
    "Divida_Garantida" : "Outras dívidas, com garantia da União",
    "Divida_demais" : "Outras dívidas, sem garantia da União"
  };

  const rotulos = {};

  for (el of dados) {
    if (el.Escopo == "Total") {
      if (el.tipo_divida == "Divida_Total") {
        rotulos[el.Escopo + "_" + el.tipo_divida] = {
          x: dados_vis[0].x_0,
          y: dados_vis[0].y,
          texto: tipos_dividas[el.tipo_divida],
          valor : valor_formatado(el.valor),
          cor : cor(el.Escopo)
        }
      } 
      else {
        const mini_dados_vis = dados_vis.filter(
          d => d.tipo_divida == el.tipo_divida);
          // pegando o [0], pq sempre vou ter dois elementos para cada tipo_divida
          // em "dados_vis", e me interessa só o primeiro
        rotulos[el.Escopo + "_" + el.tipo_divida] = {
          x: mini_dados_vis[0].x_1,
          y: mini_dados_vis[0].y,
          texto : tipos_dividas[el.tipo_divida],
          valor: valor_formatado(el.valor),
          cor : cor("Destaque") // esses são as barras do
                                // waterfall
        }
      }

    } 
    else if (el.tipo_divida != "Divida_Total") {
      // pq não me interessa os valores totais por "Escopo".
      // aqui agora estou vendo os tipos de divida (Uniao, Garantias, demais)
      // para cada escopo (Estados e Municipios)
      const mini_dados_vis = dados_vis.filter(
        d => d.Escopo == el.Escopo && d.tipo_divida == el.tipo_divida);
      // o mini_dados_vis resultante aqui vai ser uma array de um objeto só
      rotulos[el.Escopo + "_" + el.tipo_divida] = {
        x: mini_dados_vis[0].x_2,
        y: mini_dados_vis[0].y_2,
        texto : "",
        valor : valor_formatado(el.valor),
        cor : d3.rgb(cor(el.Escopo)).darker()
      }        
    }
  }

  console.log("Rotulos", rotulos);


  
  //////////
  // binding
  const bars = $svg_endividamento
    .selectAll("rect")
    .data(dados_vis);
  
  //console.log(bars);

  //$svg_endividamento.style("background-color", "cornsilk")

  // funções para desenhar

  const abertura = function() {
    //uma barrona
    $svg_endividamento
      .append("rect")
      .classed("d3--endividamento-total", true)
      .attr("x", dados_vis[0].x_0)
      .attr("y", y_max)
      .attr("height", 0)
      .attr("width", bar_width)
      .attr("stroke-width", 0)
      .attr("fill", cor("Total"))
      .transition()    
      .duration(500)
      .attr("y", y(0))
      .attr("height", l_max);

    //uma linha de referência
    $svg_endividamento
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", margin.left + w_liq_honras)
      .attr("y1", y_max)
      .attr("y2", y_max)
      .attr("stroke", "transparent")
      .transition()
      .duration(500)
      .attr("stroke", "#333")
    
    // segmentos de barrinhas
    bars.enter().append("rect")
      .classed("d3--endividamento", true)
      .attr("x", d => d.x_0)
      .attr("y", d => d.y)
      .attr("height", d => d.height)
      .attr("width", bar_width)
      .attr("stroke-width", 0)
      .attr("fill", cor("Total"))
      .attr("opacity", 0)
      .transition()
      .delay(500)
      .attr("opacity", 1);
  }

  const remove_barra_total = function() {
    d3.select(".d3--endividamento-total").remove()
  };

  const step_waterfall = function(tipo_divida, direction) {
    const bar_atual = d3.selectAll("rect.d3--endividamento").filter(d => d.tipo_divida == tipo_divida);
    //console.log("barra atual", bar_atual);
    bar_atual.transition().duration(500)
    .attr("x", d => direction == "down" ? d.x_1 : d.x_0)
    .attr("fill", direction == "down" ? cor("Destaque") : cor("Total"));
  }

  const step_colore = function(direction) {
    //console.log("Disparei função colore, com a direção", direction);
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

  ///////////////////////////////////////////
  // rotulos
  const pad_rotulo = 10;
  const largura_rotulo = w_liq_honras/4 - 2*pad_rotulo

  const mostra_rotulo = function(escopo, tipo_divida, alinhamento) {
    dados_rotulo = rotulos[escopo+"_"+tipo_divida];

    const div_rotulo = $container_endividamento
      .append("div")
      .classed("rotulos-endiv", true)
      .classed("rotulos-"+escopo+tipo_divida, true)
      .style("top", dados_rotulo.y + "px")
      .style("left", alinhamento == "left" ? dados_rotulo.x + bar_width + pad_rotulo + "px" : dados_rotulo.x - largura_rotulo - pad_rotulo + "px")
      .style("width", largura_rotulo+"px")
      .style("text-align", alinhamento)
      .style("color", dados_rotulo.cor)
      .style("opacity", 0);

    div_rotulo
      .append("p")
      .html("<strong>"+dados_rotulo.texto+"</strong>");
    div_rotulo
      .append("p")
      .text(dados_rotulo.valor);

    div_rotulo.transition().duration(500).style("opacity", 1);
  }

  const remove_rotulo = function(escopo, tipo_divida) {
    $container_endividamento
      .select(".rotulos-"+escopo+tipo_divida)
      .transition()
      .duration(500)
      .style("opacity", 0)
      .remove();
  }

  console.log("Tipos dividas", d3.map(dados_vis, d => d.tipo_divida).keys());

  // monta tabela para construir rótulos do "eixo"
  let tipos = d3.map(dados_vis, d => d.tipo_divida).keys();
  tipos = tipos.map(el => ({
    rotulo : tipos_dividas[el],
    pos_x  : (dados_vis.filter(d => d.tipo_divida == el)[0].x_1)
  }))

  const monta_rotulos_eixo = function() {
    $container_endividamento
      .selectAll("p.rotulos-eixo-endiv")
      .data(tipos)
      .enter()
      .append("p")
      .classed("rotulos-eixo-endiv", true)
      .text(d => d.rotulo)
      .style("width", largura_rotulo + "px")
      .style("font-style", "italic")
      .style("top", y_max + "px")
      .style("left", d => d.pos_x - largura_rotulo/2 + bar_width/2 + "px")
      .style("text-align", "center")
      .style("opacity", 0)
      .transition()
      .duration(500)
      .style("opacity", 1);
  }

  const remove_rotulos_eixo = function() {
    $container_endividamento
      .selectAll("p.rotulos-eixo-endiv")
      .transition()
      .duration(500)
      .style("opacity", 0)
      .remove();
  }

  const mostra_rotulos_barrinhas = function(direcao) {
    const rotulinhos = $container_endividamento
      .selectAll("p.rotulos-barrinhas");

    rotulinhos.remove();

    if (direcao == "down") {
      rotulinhos
        .data(dados_vis)
        .enter()
        .append("p")
        .classed("rotulos-barrinhas", true)
        .text(d => d.valor_formatado)
        .style("width", largura_rotulo + "px")
        .style("color", d => cor(d.Escopo))
        .style("top", d => "calc(" + (d.y_2 - pad_rotulo/2) + "px - 0.6rem)")
        .style("left", d => d.Escopo == "Estados" ? d.x_2 + bar_width - largura_rotulo + "px" : d.x_2 + "px")
        .style("text-align", d => d.Escopo == "Estados" ? "right" : "left")
        .style("opacity", 0)
        .transition()
        .delay(550)
        .duration(100)
        .style("opacity", 1);
    }
  }

  ////////////////////
  // ze SCROLLER!

  //const $figure = $container_endividamento.select("figure");

  //const scroller = scrollama();

  // setup
  scroller
    .setup({
      step: ".endividamento-steps",
      offset: offset_calc,
      debug: false
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
      //console.log("Step Data", response.index, response.direction);

      switch (response.index) {
        case 1:
          abertura();
          if (response.direction == "down") {
            mostra_rotulo("Total", "Divida_Total", "left")
          } else {
            remove_rotulo("Total", "Divida_Total");
            $svg_endividamento.selectAll("*")
              .transition()
              .duration(250)
              .attr("opacity", 0)
              .remove();
          } 
          break;
        case 2:
          step_waterfall("Divida_Uniao", response.direction);
          if (response.direction == "down") {
            mostra_rotulo("Total", "Divida_Uniao", "right");
            remove_rotulo("Total", "Divida_Total");
            remove_barra_total();
          } else {
            remove_rotulo("Total", "Divida_Uniao");
          }
          break;
        case 3:
          step_waterfall("Divida_Garantida", response.direction);
          if (response.direction == "down") mostra_rotulo("Total", "Divida_Garantida", "right")
          else remove_rotulo("Total", "Divida_Garantida");
          break;
        case 4:
          step_waterfall("Divida_demais", response.direction);
          if (response.direction == "down") mostra_rotulo("Total", "Divida_demais", "left");
          else remove_rotulo("Total", "Divida_demais");
          break;  
        case 5:
          step_colore(response.direction);
          if(response.direction == "up") {
            remove_rotulos_eixo();
            $container_endividamento.selectAll("p")
            .transition()
            .duration(250)
            .attr("opacity", 0)
            .remove();
          }
          break; 
        case 6:
          remove_rotulo("Total", "Divida_Uniao");
          remove_rotulo("Total", "Divida_Garantida");
          remove_rotulo("Total", "Divida_demais");
          step_separa(response.direction);
          if(response.direction == "down") monta_rotulos_eixo()
          mostra_rotulos_barrinhas(response.direction);
          break;                                  
      }
    });

  window.addEventListener("resize", debounce(handleResize, 1000));
    /*
    .onStepExit(response => {
      $steps.filter((d, i) => (i === response.index))
      .transition()
      .duration(200)
      .opacity(0);
    })*/


});