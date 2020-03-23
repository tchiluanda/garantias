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
  h_bruto = window.innerHeight * 0.7
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
  left: w_honras < 600 ? 20 : 40,
  right: w_honras < 600 ? 20 : 40
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
  const honras_det = files[1];

  //console.log(honras_det[0])

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

  //console.log("serie mes stack", serie_mes_stack);

  const serie_acum_total = serie_acum.map(d => ({
    "data_mes" : d.data_mes,
    "valor"    : d["Demais entes"] + 
               d["Estado do Rio de Janeiro"] +
               d["Minas Gerais"]
  }));

  //console.table(serie_acum_total);
  //console.log(serie_acum)

  //console.log(serie_acum_stack)//, serie_mes_stack, serie_qde_stack)

  /////////////////////////////// escalas

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

  const y_mens = d3.scaleLinear()
                   .range(range_y)
                   .domain([0, obtem_maximo_serie(serie_mes)]);

  const y_qde  = d3.scaleLinear()
                   .range(range_y)
                   .domain([0, obtem_maximo_serie(serie_qde)]);                   
      
  //// cores
  const cor = d3.scaleOrdinal()
                .range(["#ffb14e",
                "#ea5f94",
                "#9d02d7"])
                .domain([categorias]); 

  const cinza = "#999";

  const cor_so_rio = d3.scaleOrdinal()
                        .range([cinza,
                                "#ea5f94",
                                cinza])
                        .domain([categorias]); 
  
  //let cor_so_rio = cor;
  //cor_so_rio.range(["#ffb14e", cinza, cinza]);
  //console.log("aqui, depois de ajustar cor_so_rio", cor.range());
  //let cor_rio_mg = cor;
  //cor_rio_mg.range(["#ffb14e", "#ea5f94", cinza]);
  //console.log(cor.range(), cor_so_rio.range())
  //console.log(categorias.map(d => cor_so_rio(d)));

  //// nomes das classes
  // const nomes = d3.scaleOrdinal()
  //                  .range(["rio", "mg", "demais"])
  //                  .domain([categorias]);

  //                  console.log(categorias, categorias.map(d => nomes(d)));
                
  // eixos
  //// x
  let eixo_x = d3.axisBottom()
        .scale(x)

  // se a largura não for suficiente,
  // usa apenas os anos nos ticks

  if (w_honras < 520)
      eixo_x = eixo_x.tickFormat(d => formataData_Anos(d))
                     .ticks(d3.timeYear.every(1));
  else
      eixo_x = eixo_x.tickFormat(d => formataData(d))
                     .ticks(d3.timeMonth.every(6));

  //// y

  let eixo_y_ac = d3.axisLeft()
                    .scale(y_acu)
                    .tickFormat(d => formataBR(d/1e9));

  let eixo_y_me = d3.axisLeft()
                    .scale(y_mens)
                    .tickFormat(d => formataBR(d/1e6));
                    
  let eixo_y_qd = d3.axisLeft()
                    .scale(y_qde);                     


  // gerador de area
  const area = d3.area()
                 .x(d => x(d.data.data_mes))
                 .y0(d => y_acu(d[0]))
                 .y1(d => y_acu(d[1]));

  const area_mes = d3.area()
                 .x(d => x(d.data.data_mes))
                 .y0(d => y_mens(d[0]))
                 .y1(d => y_mens(d[1]));                 
  
  // gerador de linha para o total               
  const line = d3.line()
                 .x(d => x(d.data_mes))
                 .y(d => y_acu(d.valor));

  const linha = line(serie_acum_total);  
  const area_rio = area(serie_acum_stack[0]);       

  //////////////// dados para as anotações

  // primeira honra
  const ponto_primeira_honra = {
    "x" : d3.timeParse("%Y-%m-%d")(honras_det[0].data_mes),
    "y" : honras_det[0].valor
  };

  // ultimo valor rio de janeiro
  const ponto_total_rio = {
    "x" : serie_acum[serie_acum.length - 1].data_mes,
    "y" : serie_acum[serie_acum.length - 1]["Estado do Rio de Janeiro"]
  };

  const valor_total_rio = {
    "valor" : valor_formatado(ponto_total_rio.y),
    "percent" : Math.round(100*ponto_total_rio.y / serie_acum_total[serie_acum_total.length-1].valor, 0)
  }

  const infos_arcos = [
    {
      "key": "Estado do Rio de Janeiro",
      "ponto_inicial" : {
        "x" : 0.26*w_honras, 
        "y" : 0.58*h_honras 
      },
      "ponto_final" : {
        "x" : 0.44*w_honras, 
        "y" : 0.77*h_honras
      }
    },
    {
      "key": "Minas Gerais",
      "ponto_inicial" : {
        "x" : 0.65*w_honras, 
        "y" : 0.31*h_honras 
      },
      "ponto_final" : {
        "x" : 0.76*w_honras, 
        "y" : 0.39*h_honras
      }
    },
    {
      "key": "Demais entes",
      "ponto_inicial" : {
        "x" : 0.79*w_honras, 
        "y" : 0.15*h_honras 
      },
      "ponto_final" : {
        "x" : 0.85*w_honras, 
        "y" : 0.21*h_honras
      }
    }];

  d3.select("#honras-total-rio").text(valor_total_rio.valor);
  d3.select("#honras-total-rio-pct").text(valor_total_rio.percent);
  d3.select("#d3-honras-nome-rio").style("color", cor("Estado do Rio de Janeiro"));
  d3.select("#d3-honras-nome-mg").style("color", cor("Minas Gerais"));

  // gera_arco definida em "utils.js"

  ///////////// cria os elementos visuais
   
  const area_empilhada = $svg_honras
    .selectAll("path.d3-honras-step-2")
    .data(serie_acum_stack)
    .enter()
    .append("path")
    .attr("class", d => "d3-honras-area-" + d.key.slice(0,3))
    .attr("d", area)
    .classed("d3-honras-step-2", true)
    .attr("fill", "#FAFFFF")//cinza)
    .attr("stroke", "none")
    .attr("opacity", 0);

  // const retangulo_cortina = $svg_honras
  //   .append("rect")
  //   .classed("honras-retangulo-cortina", true)
  //   .attr("x", x(ponto_primeira_honra.x))
  //   .attr("y", y_acu(obtem_maximo_serie(serie_acum)))
  //   .attr("height", y_acu(0) - y_acu(obtem_maximo_serie(serie_acum)))
  //   .attr("width", w_liq_honras - margin_honras.left + 3);
  
  // eixos
  // inclui eixo x

  $svg_honras
    .append("g") 
      .attr("class", "axis x-axis")
      .attr("transform", "translate(0," + (h_honras - margin_honras.bottom) + ")")
    .call(eixo_x);

  // inclui eixo y
  const eixo_y = $svg_honras
    .append("g") 
      .attr("class", "axis y-axis")
      .attr("transform", "translate(" + margin_honras.left + ",0)")
    .call(eixo_y_ac);

  $svg_honras
    .select(".y-axis .tick:last-of-type text").clone()
      .attr("x", 5)
      .attr("text-anchor", "start")
      .style("font-weight", "bold")
      .classed("d3-honras-titulo-eixoY", true)
      .text("Valores acumulados");
  

  const primeira_linha = $svg_honras
    .append("path")
    .classed("d3-honras-linha-inicial", true)
    .attr("d", linha)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 2);    

  const honras_larg_barra = w_liq_honras/serie_mes.length;

  let barras_mensais = $svg_honras
    .append("g")
    .selectAll("g.d3-honras-barras-mensais")
    .data(serie_mes_stack)
    .enter()
    .append("g")
      .classed("d3-honras-barras-mensais", true)
      .attr("fill", d => cor(d.key))
    .selectAll("rect.d3-honras-barras-mensais")
    .data(d => d)
    .enter()
    .append("rect")
      .classed("d3-honras-barras-mensais", true)
      .attr("x", (d, i) => x(d.data.data_mes) - honras_larg_barra/2)
      .attr("y", d => y_mens(d[1]))
      .attr("height", d => y_mens(d[0]) - y_mens(d[1]))
      .attr("width", honras_larg_barra)
      .attr("opacity", 0);

  // labels arcos
  const arcos_tracos = $svg_honras
    .selectAll("path.d3-honras-arco")
    .data(infos_arcos)
    .enter()
    .append("path")
    .attr("class", d => "d3-honras-arco-" + d.key.slice(0,3))
    .classed("honras-arco-anotacao", true)
    .classed("d3-honras-arcos", true)    
    .attr("d", d => gera_arco(d.ponto_inicial.x, 
                              d.ponto_inicial.y,
                              d.ponto_final.x,
                              d.ponto_final.y))
    .attr("opacity", 0);

  const arcos_labels = $container_honras
    .selectAll("p.d3-honras-arco")
    .data(infos_arcos)
    .enter()  
    .append("p")
    .attr("class", d => "d3-honras-arco-" + d.key.slice(0,3))
    .classed("labels-honras", true)
    .classed("d3-honras-arcos", true) // para remover todos no proximo step
    .style("max-width", d => d.ponto_inicial.x/2 + "px")
    .style("top", d => d.ponto_inicial.y + "px")
    .style("left", d => d.ponto_inicial.x + "px")
    .style("text-align", "right")
    .style("color", d => cor(d.key))
    .text(d => d.key)
    .style("opacity", 0);

  // labels arcos: ajusta posições
         // usando vanilla para poder usar o .forEach
  arcos_labels.nodes().forEach(element => {
    const dims = element.getBoundingClientRect();
    //console.log("DIMS", dims);
    element.style.transform = "translate(-" + dims.width + "px, -" + dims.height/2 + "px)";
  });


  // label primeira honra
  const label_primeira_honra = $container_honras
    .append("p")
    .classed("labels-honras", true)
    .classed("d3-anotacao-step-1", true)
    .style("top", y_acu(6e9) - 3 + "px")
    .style("left", x(ponto_primeira_honra.x) -3 + "px")
    .style("text-align", "left")
    .style("color", "firebrick")
    .text("30/04/2016")
    .style("opacity", 0);
  
  const linha_ref_primeira_honra = $svg_honras
    .append("line")
    .classed("d3-anotacao-step-1", true)
    .attr("x1", x(ponto_primeira_honra.x))
    .attr("x2", x(ponto_primeira_honra.x))
    .attr("y1", y_acu(6e9) + label_primeira_honra.node().getBoundingClientRect().height)
    .attr("y2", y_acu(6e9) + label_primeira_honra.node().getBoundingClientRect().height)
    .attr("stroke", "firebrick")
    .attr("stroke-dasharray", 2)
    .attr("opacity", 0);

  // cria o ponto da primeira honra.
  const primeira_honra = $svg_honras
    .append("circle")
    .classed("d3-honras-step-1", true)
    .attr("cx", x(ponto_primeira_honra.x))
    .attr("cy", y_acu(ponto_primeira_honra.y))
    .attr("r", 2)
    .attr("stroke", "#444")
    .attr("opacity", 0);

  const primeira_honra2 = primeira_honra.clone()
    .attr("r", 50)
    .attr("stroke", "firebrick")
    .attr("stroke-width", 3)
    .attr("fill", "none");

  // cria o ponto do valor final do rio.
  const final_rio = $svg_honras
    .append("circle")
    .classed("d3-honras-step-2", true)
    .attr("cx", x(ponto_total_rio.x))
    .attr("cy", y_acu(ponto_total_rio.y))
    .attr("r", 2)
    .attr("stroke", "#444")
    .attr("opacity", 0);

  const final_rio2 = final_rio.clone()
    .attr("r", margin_honras.right - 3)
    .attr("stroke", "firebrick")
    .attr("stroke-width", 3)
    .attr("fill", "none");

  //texto do valor final do rio
  const valor_final_rio = $svg_honras
    .append("text")
    .classed("d3-honras-anotacao-valor-rio", true)
    .attr("x", x(ponto_total_rio.x) + 1)
    .attr("y", y_acu(ponto_total_rio.y) - 10)
    .text(valor_total_rio.valor)
    .attr("text-anchor", "left")
    .style("font-weight", "bold")
    .style("font-size", ".7rem")
    .attr("opacity", 0);

  // const grafico_rio = $svg_honras
  //   .append("path")
  //   .classed("d3-honras-step-2", true)
  //   .attr("d", area_rio)
  //   .attr("fill", "steelblue")
  //   .attr("opacity", 0);

  ////////////////// funçoes para desenhar os steps

  const duracao = 500;

  function aparece(seletor, delay, svg = true) {
    // testa se foi passada uma seleção ou um seletor (css)
    let selecao = typeof(seletor) === "object" ? seletor : d3.selectAll(seletor);
    selecao = selecao    
      .transition()
      .delay(delay)
      .duration(duracao);
    if (svg) selecao.attr("opacity", 1);
    else selecao.style("opacity", 1)
    //console.log("to no aparece, meu seletor foi ", seletor, "minha selecação foi", selecao);
  }

  function desaparece(seletor, svg = true) {
    // testa se foi passada uma seleção ou um seletor (css)
    let selecao = typeof(seletor) === "object" ? seletor : d3.selectAll(seletor);
    selecao = selecao 
      .transition()
      .duration(duracao);
    if (svg) selecao.attr("opacity", 0);
    else selecao.style("opacity", 0)
  }

  function desenha_step1(direcao) {
    //console.log("disparei", direcao)
    if (direcao == "down") {
      aparece(".d3-honras-step-1", 0);
      linha_ref_primeira_honra
        .attr("opacity", 1)
        .transition()
        .duration(duracao)
        .attr("y2", y_acu(ponto_primeira_honra.y));
      aparece(label_primeira_honra, 0, svg = false);
      primeira_honra2
        .transition()
        .delay(duracao)
        .duration(duracao)
        .attr("r", 7);
      linha_ref_primeira_honra


    } else if (direcao == "up") {
      desaparece(".d3-honras-step-1");
      desaparece("line.d3-anotacao-step-1");
      desaparece(label_primeira_honra, svg = false);
      primeira_honra2
        .attr("r", 50);
    }
  }

  function desenha_step2(direcao) {
    //console.log("disparei step2", direcao)
    if (direcao == "down") {
      aparece(area_empilhada, 0, true);
      aparece("path.d3-honras-arco-Est", delay = duracao*1.5);
      aparece("p.d3-honras-arco-Est", delay = duracao*1.5, false);
      $svg_honras
        .select(".d3-honras-area-Est")
        .transition()
        .delay(duracao)
        .duration(duracao)
        .attr("fill", d => cor(d.key));
      aparece("text.d3-honras-anotacao-valor-rio", duracao)
      aparece(final_rio, duracao);
      final_rio2
        .transition()
        .delay(duracao*2)
        .duration(duracao)
        .attr("opacity", 1)
        .transition()
        .delay(duracao)
        .duration(duracao)
        .attr("r", 7);

      // retangulo_cortina
      //   .transition()
      //   .duration(duracao * 2)
      //   .attr("x", w_liq_honras + margin_honras.left);

    } else if (direcao == "up") {
      desaparece(".d3-honras-step-2");
      desaparece("text.d3-honras-anotacao-valor-rio");
      desaparece("path.d3-honras-arco-Est");
      desaparece("p.d3-honras-arco-Est", false);
      final_rio2
        .attr("r", 50);
      area_empilhada
        .attr("fill", cinza)
        .attr("stroke", cinza)
    }
  }

  function desenha_step3(direcao) {
    //console.log("disparei", direcao)
    if (direcao == "down") {
      aparece(arcos_tracos, duracao);
      aparece(arcos_labels, duracao, false);      
      area_empilhada
        .transition()
        .duration(duracao)
        .attr("fill", d => cor(d.key))//d => cor_rio_mg(d.key));

    } else if (direcao == "up") {
      desaparece(arcos_tracos);
      desaparece(arcos_labels, false);    
      area_empilhada
        .transition()
        .duration(duracao)
        .attr("fill", d => cor_so_rio(d.key));
    }
  }

  function desenha_step4(direcao) {
    if (direcao == "down") {
      $svg_honras.selectAll("path.d3-honras-step-2")
        .data(serie_mes_stack)
        .transition()
        .duration(duracao)
        .attr("d", area_mes)
        .transition()
        .duration(duracao)
        .attr("opacity", 0);

      desaparece(primeira_linha);        
      
      eixo_y
        .transition()
        .duration(duracao)
        .call(eixo_y_me);

      $svg_honras.select(".y-axis .tick:last-of-type text").clone()
        .attr("x", 5)
        .attr("text-anchor", "start")
        .style("font-weight", "bold")
        .classed("d3-honras-titulo-eixoY", true)
        .text("Valores mensais");

      barras_mensais
        .transition()
        .duration(duracao)
        .attr("opacity", 1)
        .transition()
        .duration(duracao * 1.5)
        .attr("width", honras_larg_barra * .75);

        console.log(barras_mensais)


    } else if (direcao == "up") {

      $svg_honras.selectAll("path.d3-honras-step-2")
        .data(serie_acum_stack)
        .transition()
        .duration(duracao)
        .attr("d", area)
        .attr("opacity", 1);

      aparece(primeira_linha);

      eixo_y
        .transition()
        .duration(duracao)
        .call(eixo_y_ac);

      $svg_honras.select(".y-axis .tick:last-of-type text").clone()
        .attr("x", 5)
        .attr("text-anchor", "start")
        .style("font-weight", "bold")
        .classed("d3-honras-titulo-eixoY", true)
        .text("Valores acumulados");

      barras_mensais
        .attr("opacity", 0);
    }
  }

  function desenha_step5(direcao) {
    if (direcao == "down") {    
      
      eixo_y
        .transition()
        .duration(duracao)
        .call(eixo_y_qd);     

      barras_mensais = $svg_honras
        .selectAll("g.d3-honras-barras-mensais")
        .data(serie_qde_stack)
        .selectAll("rect.d3-honras-barras-mensais")
        .data(d => d)
        .transition()
        .duration(duracao)
        .attr("y", d => y_qde(d[1]))
        .attr("height", d => y_qde(d[0]) - y_qde(d[1]));


    } else if (direcao == "up") {

      console.log("oi eu")

      eixo_y
        .transition()
        .duration(duracao)
        .call(eixo_y_me);

      barras_mensais = $svg_honras
        .selectAll("g.d3-honras-barras-mensais")
        .data(serie_mes_stack)
        .selectAll("rect.d3-honras-barras-mensais")
        .data(d => d)
        .transition()
        .duration(duracao)
        .attr("y", d => y_mens(d[1]))
        .attr("height", d => y_mens(d[0]) - y_mens(d[1]));


    }
    
  }

  //console.log(ponto_total_rio)
  //console.log(serie_acum_total)

  //gera_grid($svg_honras, 20);

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
          console.log("step1", response.direction);
          desenha_step1(response.direction);
          break;
        case 2:
          desaparece(".d3-honras-step-1");
          desaparece("line.d3-anotacao-step-1");
          desaparece(label_primeira_honra, false);
          desenha_step2(response.direction);
          break;
        case 3:
          desaparece("circle.d3-honras-step-2");
          desaparece("text.d3-honras-anotacao-valor-rio");
          desenha_step3(response.direction)
          break;
        case 4:
          desaparece(arcos_tracos);
          desaparece(arcos_labels, false);    
          desenha_step4(response.direction)
          break;    
        case 5:  
          desenha_step5(response.direction)
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