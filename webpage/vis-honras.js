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
  w_honras = w_bruto //>= 600 ? 600 : w_bruto;

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
  left: w_honras < 600 ? 10 : 20,
  right: w_honras < 600 ? 10 : 20
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
    //el.data_mes = d3.timeParse("%Y-%m-%d")(el.data_mes);
  }

  //let teste = honras_agg.slice(0,10);
  //console.log(honras_agg[0]);
  //console.table(files[1]);

  // ver isso aqui depois: https://observablehq.com/@d3/stacked-area-chart-via-d3-group
  //gera um série para cada categoria de mutuário (mutuario_cat)
  //e tipo de valor 
  function gera_series_formato_stack(dados, categoria, tipo_valor, lista_datas) {
    //obtem uma lista unica das categorias selecionadas
    const lista_categorias = d3.map(dados, d => d[categoria]).keys();
    //console.log(lista_categorias);
    
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
      // deixei para converter a data aqui, porque ela estava
      // vindo como string
      elemento["data_mes"] = d3.timeParse("%Y-%m-%d")(data);
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

  //console.log(lista_datas)
  //console.table(serie_acum);
  //console.table(honras_agg)
  //console.table(serie_mes);
  //console.table(serie_qde);

  // definindo a ordem das categorias
  const categorias = ["Estado do Rio de Janeiro", "Minas Gerais", "Demais entes"];

  // cria a função de stack com essa lista de categorias
  const stack = d3.stack()
    .keys(categorias)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetNone);

  const stack_stream = d3.stack()
    .keys(categorias)
    .order(d3.stackOrderNone)
    .offset(d3.stackOffsetSilhouette); 
  
  // cria as versões stacked das series
  const serie_acum_stack = stack(serie_acum);
  const serie_acum_stack_stream = stack_stream(serie_acum);
  const serie_mes_stack = stack(serie_mes);
  const serie_qde_stack = stack(serie_qde);

  // console.log(serie_acum_stack, serie_mes_stack, serie_qde_stack)
  // escalas


  //// x - tempo
  // para começar de janeiro...
  const primeira_data = (honras_agg[0].data_mes).slice(0,4)+"-01-01"
  const PERIODO = [d3.timeParse("%Y-%m-%d")(primeira_data), //d3.extent(serie_acum, d => d.data_mes);
                   d3.max(serie_acum, d => d.data_mes)];
  const PERIODO2 = d3.extent(serie_acum, d => d.data_mes);
  //console.log(PERIODO);

  const x = d3.scaleTime()
              .domain(PERIODO)
              .range([margin_honras.left, w_honras-margin_honras.right])

  //// y - valores
  
  function obtem_maximo_serie(serie) {
    const lista_maximos = [];
    for (cat of categorias) {
      const maximo_coluna = d3.max(serie, d => d[cat]);
      lista_maximos.push(maximo_coluna);
    }
    return d3.sum(lista_maximos);  
  }


  const range_y = [h_honras - margin_honras.bottom, margin_honras.top];

  const y_acu = d3.scaleLinear()
                  .range(range_y)
                  .domain([0, obtem_maximo_serie(serie_acum)]);


  const y_acu_stream = d3.scaleLinear()
                  .range(range_y)
                  .domain([-obtem_maximo_serie(serie_acum)/2, obtem_maximo_serie(serie_acum)/2]);

  //// cores
  const cor = d3.scaleOrdinal()
                .range(d3.schemeCategory10)
                .domain([categorias]); 
                
  // eixos
  //// x
  let eixo_x = d3.axisBottom()
        .scale(x)

  // se a largura não for suficiente,
  // usa apenas os anos nos ticks

  if (w_honras < 520)
      eixo_x = eixo_x.tickFormat(d => formataData_Anos(d));
  else
      eixo_x = eixo_x.tickFormat(d => formataData(d))
                     .ticks(d3.timeMonth.every(6));

  // gerador de area
  const area = d3.area()
                 .x(d => x(d.data.data_mes))
                 .y0(d => y_acu(d[0]))
                 .y1(d => y_acu(d[1]));

  const area_stream = d3.area()
                 .x(d => x(d.data.data_mes))
                 .y0(d => y_acu_stream(d[0]))
                 .y1(d => y_acu_stream(d[1]));                 

  const line = d3.line()
                 .x(d => x(d.data_mes))
                 .y(d => y_acu(d["Demais entes"]));

    

  //console.log("Componentes escala x", x.domain(), x.range()) 
  //console.log("x", x(serie_acum[0].data_mes))
  //console.log("x", x(honras_agg[0].data_mes))
  //console.log("testa componentes linha", serie_acum.map(d => [d.data_mes, x(d.data_mes),
  //                                 y_acu(d["Demais entes"])]));
  
  // $svg_honras.select("path")
  //            .datum(serie_acum)
  //            .enter()
  //            .append("path")
  //            .attr("d", line);

  //console.log(" ", [margin_honras.left, w_honras-margin_honras.right]);
  //console.log("serie stack", serie_acum_stack);
  //console.log("area aplicada", area(serie_acum_stack[0]));

  function draw_step0() {
    $svg_honras.selectAll("path.honras-area-cum")
             .data(serie_acum_stack_stream)
             .enter()
             .append("path")
             .classed("honras-area-cum", true)
             .attr("d", area_stream)
             .attr("fill", ({key}) => cor(key));
  }

  function draw_step1() {
    $svg_honras.selectAll("path.honras-area-cum")
             .data(serie_acum_stack)
             .transition()
             .duration(1500)
             .attr("d", area)
             .attr("fill", ({key}) => cor(key));
  }

  //.transition()
  //.duration(1500)

  // inclui eixo

  $svg_honras.append("g") 
          .attr("class", "axis x-axis")
          .attr("transform", "translate(0," + (h_honras - margin_honras.bottom) + ")")
          .attr("opacity", 1)
          .call(eixo_x);

  draw_step0();
  d3.select("button").on("click", function() {
    console.log("oi!")
    draw_step1()

    //draw_step1()
  });
  


  ////////////////////
  // ze SCROLLER!

  //const $figure = $container_endividamento.select("figure");

  //const scroller = scrollama();

  // setup
  scroller_honras
    .setup({
      step: ".honras-steps",
      offset: offset_calc,
      debug: false
    })
    .onStepEnter(response => {

      $steps_honras.classed("step-ativo", (d, i) => (i === response.index));
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
          draw_step1();
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