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
  stepH = Math.floor(window.innerHeight * 1);
  $steps_honras.style("height", Math.floor(stepH) + "px");
  // faz o último step ser metade do tamanho.
  $steps_honras.nodes()[$steps_honras.nodes().length-1].style.height = stepH/2 + "px";



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
  left: w_honras < 600 ? 25 : 40,
  right: w_honras < 600 ? 20 : 40
};

const w_liq_honras = w_honras - margin_honras.left - margin_honras.right;

$svg_honras     
  .attr('width', w_honras)
  .attr('height', h_honras);

// leitura do arquivo

Promise.all([
  d3.csv("../webpage/dados/dados_honras_agg.csv"),
  d3.csv("../webpage/dados/dados_honras_det.csv"),
  d3.csv("../webpage/dados/grid_honras.csv")
]).then(function(files) {
  // files[0] will contain file1.csv
  // files[1] will contain file2.csv

  const honras_agg = files[0];
  const honras_det = files[1];
  const grid       = files[2];

  console.table(grid)
  
  //console.log(honras_det[0])

  //para formatar os valores
  for (el of honras_agg) {
    el.valor_acum = +el.valor_acum;
    el.valor_mes = +el.valor_mes;
    el.qde = +el.qde;
    //el.data_mes = d3.timeParse("%Y-%m-%d")(el.data_mes);
  }

  //console.log("Estrutura honras_agg:", honras_agg.columns, honras_agg[0]);
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

  // grid
  const max_grid_y = d3.max(grid, d => +d.y);
  const max_grid_x = d3.max(grid, d => +d.x);

  let range_grid_x, range_grid_y;
  const h_liq_honras = h_honras - margin_honras.top - margin_honras.bottom;

  if (h_liq_honras < w_liq_honras) {
    range_grid_x = [0,w_honras-10];//x.range();//[w_honras/2 - h_liq_honras/2, w_honras/2 + h_liq_honras/2];
    range_grid_y = [margin_honras.top, h_honras - margin_honras.bottom];
  } else {
    range_grid_x = [0,w_honras-10];//x.range();
    range_grid_y = [h_honras/2 - w_liq_honras/2, h_honras/2 + w_liq_honras/2];    
  }
  
  const y_grid = d3.scaleLinear()
                   .range(range_grid_y)
                   .domain([0, max_grid_y]);

  const x_grid = d3.scaleLinear()
                  .range(range_grid_x)
                  .domain([0, max_grid_x]);
      
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
  
  // raio bubbles
  const maior_honra = d3.max(honras_det, d => +d.valor);
  //console.log("Maior honra", maior_honra);


  const r_honras = d3.scaleSqrt()
    .range([2, (w_liq_honras*2/3)/15])  // 45
    .domain([0, maior_honra]);

  const soma_areas =
  honras_det
    .map(d => r_honras(+d.valor))
    .reduce((acumulador, valor_atual) => acumulador + valor_atual*valor_atual,
          initialValue = 0);


  const raio_total = Math.sqrt(soma_areas);

  //console.log(2*raio_total, w_liq_honras, 2*raio_total/w_liq_honras);
        
  
  
  
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
                
  ////////////////////////// eixos
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


  //////////////////////// geradores 
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

  // posicao primeira honra
  const ponto_primeira_honra = {
    "x" : d3.timeParse("%Y-%m-%d")(honras_det[0].data_mes),
    "y" : honras_det[0].valor
  };

  // totais por ano
  const honras_tot = honras_agg
    .filter(d => d.data_mes.substr(5,2) === "12")
    .map(d => ({"ano"   : d.data_mes.substr(0,4),
                "valor" : d.valor_acum}));
  
  const totais_anos = group_by_sum(honras_tot, "ano", "valor");
  //console.log({totais_anos});

  // total de honras
  const total_honras = honras_det
    .map(d => +d.valor)
    .reduce((ac, atual) => ac + atual);

  // ultimo valor rio de janeiro
  const ponto_total_rio = {
    "x" : serie_acum[serie_acum.length - 1].data_mes,
    "y" : serie_acum[serie_acum.length - 1]["Estado do Rio de Janeiro"]
  };

  // valor total do rio
  const valor_total_rio = {
    "valor" : valor_formatado(ponto_total_rio.y),
    "percent" : Math.round(100*ponto_total_rio.y / serie_acum_total[serie_acum_total.length-1].valor, 0)
  }

  // posições para arcos
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

  // informações para os textos dos steps
  d3.select("#honras-total-rio").text(valor_total_rio.valor);
  d3.select("#honras-total-rio-pct").text(valor_total_rio.percent);
  d3.select("#d3-honras-nome-rio").style("color", cor("Estado do Rio de Janeiro"));
  d3.select("#d3-honras-nome-mg").style("color", cor("Minas Gerais"));
  d3.select("#d3-honras-qde-pgtos").text(honras_det.length);
  d3.select("#d3-honras-valor-total").text(valor_formatado(total_honras));

  ///////////// dados para as bolhas!

  //console.log("testa funcao", group_by_sum(honras_det, "Credor", "valor", true));

  const centro_bolhas_honras = {
    x : w_liq_honras / 2 + margin_honras.left,
    y : margin_honras.top + (h_honras - margin_honras.top - margin_honras.bottom) / 2 
  }

  const honras_larg_barra = w_liq_honras/serie_mes.length;

  const honras_raio_inicial = honras_larg_barra * 0.75 / 2
  console.log(honras_raio_inicial, "raio inicial")

  // estou levando esse trecho pra dentro do step que
  // vai reiniciar a simulação, para tratar os casos em que
  // o usuário (grande amigo! :/ ) chega na parte das bolhas
  // e faz um scroll up, voltando para o dot plot.
  // nesse caso, se ele fizer um scroll down de novo, voltando
  // para o primeiro force-layout, as posições x e y das bolhas
  // serão as últimas que foram calculadas, e perderemos 
  // object constancy

  // // se a gente não inicializar atributos "x" e "y" para os dados
  // // que serão passados como "nodes", os nodes vão parecer surgir
  // // do nada (de x = 0 e y = 0, na verdade)
  // honras_det.forEach(d => {
  //   d["x"] = x(d3.timeParse("%Y-%m-%d")(d.data_mes));
  //   d["y"] = y_qde(d.pos) + honras_raio_inicial;
  // })

  function honras_gera_subconjunto(nome_coluna, vetor_pos_x, vetor_pos_y) {
    const subtotais_coluna = group_by_sum(honras_det, nome_coluna, "valor", true);

    const dados_coluna = {};
    subtotais_coluna.forEach((d,i) => {
    dados_coluna[d.categoria] = 
      {
          "rotulo" : valor_formatado(d.subtotal),
          "x"      : vetor_pos_x[i] * w_honras,
          "y"      : vetor_pos_y[i] * h_honras
      }
    }); 

    return dados_coluna;
  }

  const pos_estados = honras_gera_subconjunto(
    "estados",
    [1.5/4,   2.5/4,
       2/6,   0.95/2,   4/6,
       2/8, 3.5/8, 4.8/8, 6.5/8],
    [  1/4,   1/4,
     3.5/8, 3.7/8, 4/8,
       6/8,   6/8,   6/8, 6.2/8])

  
  const pos_tipo_divida = honras_gera_subconjunto(
    "tipo_divida",
    [1.5/4,   2.5/4],
    [1/2,   1/2]);

  const pos_credor_cat = honras_gera_subconjunto(
    "credor_cat",
    [1/2, 1/4, 3/4,
     1.5/4, 2.5/4,
     1.5/4, 2.5/4],
    [1/4, 1/4, 1/4,
     1/2, 1/2,
     2.8/4, 2.8/4]);

  //console.log(group_by_sum(honras_det, "credor_cat", "valor", true));









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
  
  ///////  eixos
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
      .text("Valores acumulados (R$ bi)");
  
  //////// demais elementos

  const primeira_linha = $svg_honras
    .append("path")
    .classed("d3-honras-linha-inicial", true)
    .attr("d", linha)
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 2);   
    
  const pontos_totais_anos = $svg_honras
    .selectAll("circle.d3-honras-ptos-totais-ano")
    .data(totais_anos)
    .enter()
    .append("circle")
      .classed("d3-honras-ptos-totais-ano", true)
      .attr("fill", "firebrick")
      .attr("r", 4)
      .attr("cx", d => x(new Date(d.categoria + "-12-01")))
      .attr("cy", d => y_acu(d.subtotal))
      .attr("opacity", 0);

  const labels_totais_anos = $container_honras
    .selectAll("p.d3-honras-ptos-totais-ano")
    .data(totais_anos)
    .enter()
    .append("p")
      .classed("d3-honras-ptos-totais-ano", true)
      .classed("labels-honras", true)
      .style("color", "firebrick")
      .style("text-align", "right")
      .style("right", d => (w_honras - x(new Date(d.categoria + "-12-01")) + 7) + "px")
      .style("bottom", d => h_honras - y_acu(d.subtotal) + "px")
      .html(d => '<strong style="font-style: normal">'+d.categoria+"</strong></br>" + valor_formatado(d.subtotal))
      .style("opacity", 0);

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
      .attr("x", (d, i) => x(d.data.data_mes))// - honras_larg_barra/2)
      .attr("y", d => y_mens(d[1]))
      .attr("height", d => y_mens(d[0]) - y_mens(d[1]))
      .attr("width", 1)
      .attr("opacity", 0);

  // as BOLHAS!
  //console.log(honras_det.columns);

  let container_bolhas_honras = $svg_honras
    .append("g")
    .classed("d3-honras-container-bolhas", true);

  let bolhas_honras = d3.select("g.d3-honras-container-bolhas")
    .selectAll("circle")
    .data(honras_det);

  const bolhas_honras_enter = bolhas_honras
    .enter()
    .append("circle")
    .classed("d3-honras-bolhas", true)
    .attr("cx", d => x(d3.timeParse("%Y-%m-%d")(d.data_mes)))
    .attr("cy", d => y_qde(d.pos) + honras_raio_inicial)
    .attr("r", honras_raio_inicial)
    .attr("fill", d => cor(d.mutuario_cat))
    .attr("opacity", 0);

  bolhas_honras = bolhas_honras.merge(bolhas_honras_enter);


  ///// labels bolhas

  const largura_labels = w_honras/4;
  const ajuste_mobile = w_honras < 400 ? 20 : 0;

  // total

  const honras_label_total = $container_honras
    .append("div")
    .style("opacity", 0)
    .style("left", centro_bolhas_honras.x - largura_labels/2 + "px")
    .style("top", h_honras - margin_honras.bottom - ajuste_mobile + "px")
    .style("width", `${largura_labels}px`)
    .classed("subtotais", true);

  honras_label_total
    .append("p")
    .text("Total honrado pela União");
  honras_label_total  
    .append("p")
    .classed("labels-honras-valor", true)
    .text("R$ " + valor_formatado(total_honras));

  // interna e externa

  let pos_labels_tipos_x = [
    1.5/4, 3/4
  ]

  const honras_label_tipo_divida = $container_honras
    .selectAll("div.subtotais-tipo")
    .data(Object.keys(pos_tipo_divida))
    .enter()
    .append("div")
    .classed("subtotais-tipo", true)
    .style("opacity", 0)
    .style("left", (d,i) => pos_labels_tipos_x[i]*w_honras - largura_labels/2 + "px")
    .style("top", d => pos_tipo_divida[d].y + h_honras/3 - ajuste_mobile + "px")
    .style("width", `${largura_labels}px`)
    .classed("subtotais", true);

  honras_label_tipo_divida
    .append("p")
    .text(d => d);

  honras_label_tipo_divida
    .append("p")
    .classed("labels-honras-valor", true)
    .text(d => "R$ " + pos_tipo_divida[d].rotulo);

  // por estados

  let pos_labels_estados_y = [
    0.40, 0.40,
    0.66, 0.66, 0.66,
    0.9 ,  0.9, 0.9 , 0.9
  ];

  let pos_labels_estados_x = [
    0.35, 0.71,
    0.29, 0.53, 0.74,
    0.21, 0.44, 0.63 , 0.86
  ];
  
  const honras_label_estados = $container_honras
    .selectAll("div.subtotais-estados")
    .data(Object.keys(pos_estados))
    .enter()
    .append("div")
    .classed("subtotais-estados", true)
    .style("opacity", 0)
    .style("left", (d,i) => pos_labels_estados_x[i]*w_honras - largura_labels/2 + "px")
    .style("top", (d,i) => pos_labels_estados_y[i]*h_honras - ajuste_mobile + "px")
    .style("width", `${largura_labels}px`)
    .classed("subtotais", true);

  honras_label_estados
    .append("p")
    .text(d => d);

  honras_label_estados
    .append("p")
    .classed("labels-honras-valor", true)
    .text(d => "R$ " + pos_estados[d].rotulo);

  // por credor

  let pos_labels_credores_y = [
    0.39, 0.39, 0.39,
    0.68, 0.68,
    0.9 ,  0.9
  ];

  let pos_labels_credores_x = [
    0.5, 0.16, 0.83, 
    0.33, 0.68,
    0.32, 0.66
  ];

  const honras_label_credores = $container_honras
    .selectAll("div.subtotais-credores")
    .data(Object.keys(pos_credor_cat))
    .enter()
    .append("div")
    .classed("subtotais-credores", true)
    .style("opacity", 0)
    .style("left", (d,i) => pos_labels_credores_x[i]*w_honras - largura_labels/2 + "px")
    .style("top", (d,i) => pos_labels_credores_y[i]*h_honras - ajuste_mobile + "px")
    .style("width", `${largura_labels}px`)
    .classed("subtotais", true);

  honras_label_credores
    .append("p")
    .text(d => d);

  honras_label_credores
    .append("p")
    .classed("labels-honras-valor", true)
    .text(d => "R$ " + pos_credor_cat[d].rotulo);    
  

  // labels arcos
  // funcao gera_arco definida em "utils.js"
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
  const valor_final_rio = $container_honras
    .append("p")
    .classed("labels-honras", true)
    .classed("d3-honras-anotacao-valor-rio", true)
    .style("right", margin_honras.right + "px")
    .style("top", y_acu(ponto_total_rio.y) - 20 + "px")
    .text(valor_total_rio.valor)
    .style("text-align", "right")
    .style("font-weight", "bold")
    .style("font-style", "normal")
    .style("opacity", 0);

  // const grafico_rio = $svg_honras
  //   .append("path")
  //   .classed("d3-honras-step-2", true)
  //   .attr("d", area_rio)
  //   .attr("fill", "steelblue")
  //   .attr("opacity", 0);


  /////////////// simulação!

  const magnitudeForca = 0.04;
  const carga = function(d) {
    return -Math.pow(r_honras(d.valor), 2.0) * magnitudeForca;
  }

  // essa é a função do tick, que vai efetivamente pegar
  // os valores x e y que foram atualizados pela simulação
  // e vai atribuir esses valores às posições cx e cy das bolhas
  
  //let k = 0; // tinha incluído isso aqui para
  // ver quantos ticks são chamados em cada
  // reinício da simulação. com os parâmetros padrão, dá 300.
  // isso estava escrito na documentação.
  
  const atualiza_bolhas_honras = function() {
    bolhas_honras
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
    //k = k + 1;
    //console.log(k)
  }

  const simulacao = d3.forceSimulation()
    .velocityDecay(0.2)
    .force('x', d3.forceX().strength(magnitudeForca).x(centro_bolhas_honras.x))
    .force('y', d3.forceY().strength(magnitudeForca).y(centro_bolhas_honras.y))
    .force('charge', d3.forceManyBody().strength(carga))
    .alphaMin(0.3) // (1)
    .on('tick', atualiza_bolhas_honras);

  // (1) : a simulação roda até que o alpha (default: 1) seja menor do
  // que o alphaMin. O alphaMin padrão é 0.001, o que dá
  // 300 ticks. com alphaMin 0.01, foram 200 ticks, e rodou bem.
  // com 0.1, foram 100, e tb rodou bem.

  simulacao.stop();
  // vamos "religar" a simulação na hora certa, dentro da função
  // de desenhar o respctivo step.
  simulacao.nodes(honras_det);


  ///// teste: se eu altero honras_det, automaticamente
  // simulacao.nodes() é alterada?
  //honras_det[0]["novo"] = "Olha eu!"
  //console.log("Teste nodes", honras_det[0], simulacao.nodes()[0]);
  // sim! essa propriedade nova aparece em nodes! ou seja, simulation.nodes() cria
  // um binding entre os nodes e o dado!

  ////////////////// funçoes para desenhar os steps

  const duracao = 200;

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


  // desenha steps

  //// próxima vez fazer algo mais inteligente,
  //// ficou muito manual e repetivo o controle
  //// do que aparece e desaparece nos ups e downs

  function desenha_step0(direcao) {
    if (direcao == "down"){
      d3.selectAll("p.d3-honras-ptos-totais-ano")
        .transition()
        .duration(duracao)
        .delay((d,i) => duracao/1.5*i)
        .style("opacity", 1);

      d3.selectAll("circle.d3-honras-ptos-totais-ano")
        .transition()
        .duration(duracao)
        .delay((d,i) => duracao/1.5*i)
        .attr("opacity", 1);
    }
    else {
      //console.log("step 0", direcao);
      linha_ref_primeira_honra.attr("opacity", 0);
      label_primeira_honra.style("opacity", 0);
      primeira_honra.attr("opacity", 0);
      primeira_honra2.attr("r", 50);
      primeira_honra2.attr("opacity", 0);
      //pontos_totais_anos.attr("opacity", 0);
      //labels_totais_anos.style("opacity", 0);

    }
  }
  
  
  function desenha_step1(direcao) {
    //console.log("disparei", direcao)
    if (direcao == "down") {
      desaparece("p.d3-honras-ptos-totais-ano", false);
      desaparece("circle.d3-honras-ptos-totais-ano");

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


    } else if (direcao == "up") {
      desaparece(".d3-honras-step-2");
      desaparece("p.d3-honras-anotacao-valor-rio", false);
      desaparece("path.d3-honras-arco-Est");
      desaparece("p.d3-honras-arco-Est", false);
      final_rio2
        .attr("r", margin_honras.right - 3);
      primeira_honra2
        .attr("r", 50);
      area_empilhada
        .attr("fill", "#FAFFFF")
        .attr("stroke", "none")
    }
  }

  function desenha_step2(direcao) {
    // Destaque Rio
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
      aparece("p.d3-honras-anotacao-valor-rio", duracao, false)
      aparece(final_rio, duracao);
      final_rio2
        .transition()
        .delay(duracao)
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
        desaparece(arcos_tracos);
        desaparece(arcos_labels, false);      
        area_empilhada
          .transition()
          .duration(duracao)
          .attr("fill", d => d.key == "Estado do Rio de Janeiro" ? cor(d.key) : "none")//d => cor_rio_mg(d.key));
        aparece("path.d3-honras-arco-Est", 0);
        aparece("p.d3-honras-arco-Est", 0, false);
        aparece("p.d3-honras-anotacao-valor-rio", 0, false)
        aparece(final_rio, 0);
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
        .attr("fill", d => cor(d.key));

    } else if (direcao == "up") {

      $svg_honras.selectAll("path.d3-honras-step-2")
        .data(serie_acum_stack)
        .transition()
        .duration(duracao)
        .attr("opacity", 1)
        .transition()
        .delay(duracao)
        .duration(duracao)
        .attr("d", area);

      $svg_honras.selectAll("rect.d3-honras-barras-mensais")
        .transition()    
        .duration(duracao)
        .attr("width", 1)
        .attr("x", (d => x(d.data.data_mes)))
        .transition()
        .delay(duracao)
        .duration(duracao)
        .attr("opacity", 0)

      aparece(arcos_tracos, duracao*2);
      aparece(arcos_labels, duracao*2, false);  

      aparece(primeira_linha, duracao*2);        
    
      eixo_y
        .transition()
        .duration(duracao)
        .call(eixo_y_ac);

      $svg_honras.select(".y-axis .tick:last-of-type text").clone()
        .attr("x", 5)
        .attr("text-anchor", "start")
        .style("font-weight", "bold")
        .classed("d3-honras-titulo-eixoY", true)
        .text("Valores acumulados (R$ bi)");
      }
  }

  function desenha_step4(direcao) {
    // transição de valores acumulados p/ mensais
    if (direcao == "down") {
      $svg_honras.selectAll("path.d3-honras-step-2")
        .data(serie_mes_stack)
        .transition()
        .duration(duracao)
        .attr("d", area_mes)
        .transition()
        .delay(duracao)
        .duration(duracao)
        .attr("opacity", 0);


      // pq não funciona chamar "barras_mensais"?
      $svg_honras
        .selectAll("rect.d3-honras-barras-mensais")
        .transition()
        .duration(duracao)
        .attr("opacity", 1)
        .transition()
        .delay(duracao)
        .duration(duracao)
        .attr("width", honras_larg_barra * .75)
        .attr("x", (d => x(d.data.data_mes) - honras_larg_barra*.75/2));

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
        .text("Valores mensais (R$ mi)");

    } else if (direcao == "up") {

        eixo_y
          .transition()
          .duration(duracao)
          .call(eixo_y_me);

        $svg_honras.select(".y-axis .tick:last-of-type text").clone()
          .attr("x", 5)
          .attr("text-anchor", "start")
          .style("font-weight", "bold")
          .classed("d3-honras-titulo-eixoY", true)
          .text("Valores mensais (R$ mi)");

        $svg_honras
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

  function desenha_step5(direcao) {
    // transição para quantidade


    if (direcao == "down") {    
      
      eixo_y
        .transition()
        .duration(duracao)
        .call(eixo_y_qd);   
      
      $svg_honras.select(".y-axis .tick:last-of-type text").clone()
        .attr("x", 5)
        .attr("text-anchor", "start")
        .style("font-weight", "bold")
        .classed("d3-honras-titulo-eixoY", true)
        .text("Quantidade");

      $svg_honras
        .selectAll("g.d3-honras-barras-mensais")
        .data(serie_qde_stack)
        .selectAll("rect.d3-honras-barras-mensais")
        .data(d => d)
        .transition()
        .duration(duracao)
        .attr("y", d => y_qde(d[1]))
        .attr("height", d => y_qde(d[0]) - y_qde(d[1]));


    } else if (direcao == "up") {
      // volta para valores mensais

      $svg_honras
        .selectAll("rect.d3-honras-barras-mensais")
        .transition()
        .duration(duracao)
        .attr("width", honras_larg_barra * .75);

      desaparece(bolhas_honras);
    }
  }

  function desenha_step6(direcao) {
    if (direcao == "down") {      
      // transição para pontos

      // barras mensais
      $svg_honras
        .selectAll("rect.d3-honras-barras-mensais")
        .transition()
        .duration(duracao)
        .attr("width", 0);

      bolhas_honras
        .transition()
        .duration(duracao)
        .attr("opacity", 1);

    } else if (direcao == "up") {

      simulacao.stop();
      bolhas_honras
        .transition()
        .duration(duracao*3)
        .attr("cx", d => x(d3.timeParse("%Y-%m-%d")(d.data_mes)))
        .attr("cy", d => y_qde(d.pos) + honras_raio_inicial)
        .attr("r", honras_raio_inicial)
        .attr("stroke-width", 0);

      aparece("g.axis", 0);
      desaparece(honras_label_total, false);
    
    } 
  }

  function desenha_step7(direcao) {
    if (direcao == "down") {
      //console.log(x_grid(+grid[32].x));
      console.log(x_grid.range(), x_grid.domain(), "y",
      y_grid.range(), y_grid.domain())
      bolhas_honras
        .transition()
        .duration(duracao)
        .attr("cx", (d,i) => x_grid(+grid[i].x))
        .attr("cy", (d,i) => y_grid(+grid[i].y))
    } else {

    }
  }

  function desenha_step8(direcao) {
    if (direcao == "down") {

      // normalmente, eu teria iniciado essas posições
      // lá em cima, mas como é um scroller, o usuário
      // pode voltar para o passo anterior e depois 
      // passar mais uma vez por aqui. por isso, preciso
      // inicializar aqui as posições iniciais de x e y
      // antes da simulação, para cada vez que o usuário
      // passar por este step, descendo. essas posições
      // iniciais correspondem às posições das bolhas no
      // dotplot. caso contrário, o último x,y armazenado
      // seria as últimas posições calculadas pela simulação,
      // e as posições saltariam do grid
      // do dotplot direto para a posição final da simulação,
      // perdendo o object constancy.
      // interessante que estou atualizando o
      // próprio dataset que foi passado como .nodes().
      // mas, depois de simulacao.nodes(dataset), é como
      // se fosse criado um "binding" entre os nodes e o
      // dataset!

      honras_det.forEach((d,i) => {
        d["x"] = x_grid(+grid[i].x);
        d["y"] = y_grid(+grid[i].y);
      })

      bolhas_honras
        .transition()
        .duration(2*duracao)
        .attr("r", d => r_honras(d.valor) - 1)
        .attr("stroke", d => d3.rgb(cor(d.mutuario_cat)).darker())
        .attr("stroke-width", 1);

        desaparece("g.axis"); 
    }
    else {
      desaparece(honras_label_tipo_divida, false);
    }

    simulacao.force('x', d3.forceX().strength(magnitudeForca*1.5).x(centro_bolhas_honras.x));
    simulacao.force('y', d3.forceY().strength(magnitudeForca*1.5).y(centro_bolhas_honras.y));
    // reset alpha, reinicia simulação
    simulacao.alpha(1).restart();
  
    aparece(honras_label_total, 0, false);

  }

  function desenha_step9(direcao) {
    // por tipo  
    simulacao.force('x', d3.forceX().strength(magnitudeForca*1.5).x(d => pos_tipo_divida[d.tipo_divida].x));
    simulacao.force('y', d3.forceY().strength(magnitudeForca*1.5).y(centro_bolhas_honras.y));
  
    // se não dá esse restart, as bolhas não se movem
    // com "vontade"
    simulacao.alpha(1).restart();

    if (direcao == "down") {
      desaparece(honras_label_total, false);
    } else {
      desaparece(honras_label_estados, false);
    }

    aparece(honras_label_tipo_divida, 0, false);

  }

  function desenha_step10(direcao) {
    // por estado

    
    simulacao.force('x', d3.forceX().strength(magnitudeForca*1.5).x(d => pos_estados[d.estados].x));
    simulacao.force('y', d3.forceY().strength(d => d.estados == "Rio de Janeiro" ? magnitudeForca*3 : magnitudeForca*1.5).y(d => pos_estados[d.estados].y));
  
    // se não dá esse restart, as bolhas não se movem
    // com "vontade"
    simulacao.alpha(1).restart();

    if (direcao == "down") desaparece(honras_label_tipo_divida, false);
    else desaparece(honras_label_credores, false);

    aparece(honras_label_estados, 0, false);

  }

  function desenha_step11(direcao) {
    if (direcao == "down") {
    
      simulacao.force('x', d3.forceX().strength(magnitudeForca*1.5).x(d => pos_credor_cat[d.credor_cat].x));
      simulacao.force('y', d3.forceY().strength(magnitudeForca*1.5).y(d => pos_credor_cat[d.credor_cat].y));
    
      // se não dá esse restart, as bolhas não se movem
      // com "vontade"
      simulacao.alpha(1).restart();
      desaparece(honras_label_estados, false);
      aparece(honras_label_credores, 0, false);
      // d3.select("article.container-honras-steps .honras-steps:last-child")
      //   .transition()
      //   .duration(duracao*3)
      //   .style("opacity", 0);
    } 

    // else {
    //   // d3.select("article.container-honras-steps .honras-steps:last-child")
    //   // .transition()
    //   // .duration(duracao/2)
    //   // .style("opacity", 1);
    // }

  }

  //console.log("h", h_honras)


  //console.log(ponto_total_rio)
  //console.log(serie_acum_total)

  //gera_grid($svg_honras, 20);

  ////////////////////
  // ze SCROLLER!

  //const $figure = $container_endividamento.select("figure");

  //const scroller = scrollama();

  //console.log("honras", honras_det.length)

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
        case 0:
          desenha_step0(response.direction);
          break;
        case 1:
          //console.log("step1", response.direction);
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
          desaparece("p.d3-honras-anotacao-valor-rio", false);
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
        case 6:  
          desenha_step6(response.direction)
          break;   
        case 7:  
          desenha_step7(response.direction)
          break;   
        case 8:  
          desenha_step8(response.direction)
          break;     
        case 9:  
          desenha_step9(response.direction)
          break; 
        case 10:  
          desenha_step10(response.direction)
          break;  
        case 11:  
          desenha_step11(response.direction)
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