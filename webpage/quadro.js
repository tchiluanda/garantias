
// *********************
// PARTE 1 - Definições, funções e objetos gerais
// *********************

// funções para formatar valores

/* já foi definido em visualizacao.js

const localeBrasil = {
  "decimal": ",",
  "thousands": ".",
  "grouping": [3],
  "currency": ["R$", ""]
};

const formataBR = d3.formatDefaultLocale(localeBrasil).format(",.2f");

const formata_vlr_tooltip = function(val){
  return "R$ "+formataBR(val/1e6)+" mi"
} */

// objeto que vai ser útil para construir o gráfico 
// do card
const periodos_maturacao = {};
    
periodos_maturacao["rotulos"] = [
  "Até 12 meses",
  "De 1 a 2 anos",
  "De 2 a 3 anos",
  "De 3 a 4 anos",
  "De 4 a 5 anos",
  "Acima de 5 anos"
];

periodos_maturacao["valores"] = [
  "Ate_12_meses", 
  "De_1_2_anos", 
  "De_2_3_anos", 
  "De_3_4_anos", 
  "De_4_5_anos",
  "Acima_5_anos"
];

periodos_maturacao["percentual"] = [
  "Ate_12_meses_percentual", 
  "De_1_2_anos_percentual", 
  "De_2_3_anos_percentual", 
  "De_3_4_anos_percentual", 
  "De_4_5_anos_percentual", 
  "Acima_5_anos_percentual"
];

// definicoes do svg

const $container_svg_card = d3.select('.container-svg-card');

const w_container_card = $container_svg_card.node().offsetWidth;

const w_svg_card = w_container_card; //> 400 ? 400 : w_container_card;
const h_svg_card = 300;

const margin = {
  "top": 10,
  "bottom": 20,
  "left": 80,
  "right": 80
};

const $svg_card = d3.select('svg.card');

$svg_card      
  .attr('width', w_svg_card)
  .attr('height', h_svg_card);

function draw_grafico_card(dados_selecionados) {
  
  const mini_dataset = periodos_maturacao["rotulos"]
    .map( (d,i) => ({
      "rotulo" : d,
      "valor": +dados_selecionados[periodos_maturacao["valores"][i]],
      "valor_percentual": dados_selecionados[periodos_maturacao["percentual"][i]] 
    }));
  
  const valor_maximo_mini = d3.max(mini_dataset, d => d.valor);

  const escala_valor = d3.scaleLinear()
    .domain([0, valor_maximo_mini])
    .range([0, w_svg_card - margin.right - margin.left]);

  //console.log("valor maximo", valor_maximo_mini, escala_valor(valor_maximo_mini));
  //console.log("classificador", dados_selecionados, dados_selecionados.Classificador);
  
  const cor_grupo = fillColor(dados_selecionados.Classificador);

  const escala_rotulos = d3.scaleBand()
    .domain(periodos_maturacao["rotulos"])
    .range([margin.top, h_svg_card - margin.bottom]);

  const rects = $svg_card.selectAll("rect")
    .data(mini_dataset);

  const largura_barra = 15;

  const rects_enter = rects
    .enter()
    .append('rect')
    .attr('x', margin.left)
    .attr('y', d => escala_rotulos(d.rotulo))
    .attr('height', largura_barra)
    .attr('width', 0)
    .attr('fill', "white");
  
  const rects_update = rects.merge(rects_enter)
    .transition()
    .duration(750)
    .attr('x', margin.left)
    .attr('y', d => escala_rotulos(d.rotulo))
    .attr('width', d => d.valor == 0 ? 0 : escala_valor(d.valor))
    .attr('fill', cor_grupo);
  
  //console.log("rotulos", periodos_maturacao["rotulos"]);
  //console.log("container", $container_svg_card); 
  

  // rotulos

  const rotulos = $container_svg_card
    .selectAll("p.rotulos")
    .data(mini_dataset);

  const rotulos_Enter = rotulos
    .enter()
    .append("p");

  const rotulos_Update = rotulos.merge(rotulos_Enter)
    .classed("rotulos", true)
    .text(d => formata_vlr_tooltip(d.valor) + " (" + d.valor_percentual + ")")
    .style("line-height", largura_barra + "px") // fundamental para centralizar!
    .style("top", d => (escala_rotulos(d.rotulo) - largura_barra/2) + "px")
    .style("width", (w_svg_card - escala_valor(valor_maximo_mini) - margin.left - 10) + "px")
    .transition()
    .duration(750)
    .style("color", cor_grupo)
    .style("left", d => ((d.valor == 0 ? 0 : escala_valor(d.valor)) + 10 + margin.left) + "px");

  // rotulos y

  const rotulos_y = $container_svg_card
    .selectAll("p.y-label")
    .data(periodos_maturacao["rotulos"])
    .enter()
    .append("p")
    .classed("y-label", true)
    .text(d => d)
    .style("line-height", largura_barra + "px") // fundamental para centralizar!
    .style("text-align", "right")
    .style("left", 10 + "px")
    .style("top", d => (escala_rotulos(d) - largura_barra/2) + "px")
    .style("width", (margin.left - 10) + "px");

  d3.select('section.quadro div.card').style('border-color', cor_grupo);
  d3.select('section.quadro span.titulo-card')
    .style('background-color', cor_grupo)
    .style('border-color', cor_grupo);

  d3.select('section.quadro span.titulo-card')
    .text(dados_selecionados.Inicio + ' (' + dados_selecionados.Classificador + ')');

  //console.log("Mini dataset", mini_dataset);


}

const $tabela_projetos = d3.select(".lista-projetos table");

console.log("selecao", $tabela_projetos.selectAll("thead, tbody"))

function monta_tabela_projetos(dados_selecionados) {
  if (dados_selecionados.length == 0) {
    d3.select("#sem-projetos").classed("hidden", false);
    $tabela_projetos
      .selectAll("thead, tbody")
        .classed("hidden", true);
    console.log("Tô no if");


  } else {

    const dados_classes = {
      "Projeto"   : "tab-projeto",
      "Credor"    : "tab-credor",
      "Moeda"     : "tab-moeda",
      "valor"     : "tab-valor",
      "data"      : "tab-data"
    };
    // esse objeto serve para estabelecer uma correlação, um mapeamento das colunas da tabela orginal com as classes que representarão as colunas da tabela html. 

    const colunas_de_interesse = Object.keys(dados_classes);
    //console.log("Colunas selecionados", dados_selecionados);

    const dados_aninhados = dados_selecionados.map(
      function(d) {
        const elemento = [];
        colunas_de_interesse.forEach(
          function(coluna) {
            //elemento.push({[coluna]: d[coluna]});
            elemento.push({"coluna": coluna,
                           "conteudo": d[coluna]});
          });
        elemento["id_projeto"] = d[""]; // (1)
        elemento["houve_honra"] = d["honras"] != "NA";
        return elemento;
      });
      //(1) : isso pra gerar um "key" para ser usada
      // no data binding logo adiante.


    //console.log("Dados aninhados", dados_aninhados);

    // espero que ninguém além de um futuro eu esteja
    // lendo, mas fiquei orgulhoso dessa minha
    // solução para popular a tabela... de repente
    // até é o padrão, mas fiquei com preguiça de 
    // procurar, preferi pensar e tentar primeiro, e 
    // acabou funcionando. usei uma
    // lógica parecida com a de gráficos stacked, ou
    // seja, usar uma versão "aninhada" do dataset,
    // que foi o que construí acima.

    // cada linha da tabela de projetos (a tabela que está sendo importada) é um elemento da array, sendo que cada um desses elementos é composto de uma outra array, em que cada elemento, por sua vez, representa uma coluna da linha de dado que será apresentada na tabela html.

    d3.select("#sem-projetos").classed("hidden", true);

    $tabela_projetos
      .selectAll("thead, tbody")
        .classed("hidden", false);

    let tab_projetos = $tabela_projetos
      .select("tbody")
      .selectAll("tr")
      .data(dados_aninhados, d => d.id_projeto);

    //console.log("tab_projetos", tab_projetos)

    const tab_projetos_enter = tab_projetos
      .enter()
      .append("tr")
      .classed("houve_honra", d => d.houve_honra)
      .selectAll("td")
      .data(d => d)
      .enter()
      .append("td")
      .attr("class", d => dados_classes[d.coluna])
      .text(d => d.coluna != "valor" ? d.conteudo : valor_formatado(+d.conteudo));

    tab_projetos
      .exit()
      .remove();
      
    tab_projetos = tab_projetos.merge(tab_projetos_enter);

    //console.log(tab_projetos);

  }


}

// *********************
// PARTE 2 - Leitura dos dados e inicio
// *********************

Promise.all([
  d3.csv("./webpage/dados/dados_quadro.csv"),
  d3.csv("./webpage/dados/contratos.csv"),
]).then(function(files) {

  const dados = files[0];
  const projetos = files[1];

 // console.log("Colunas", dados.columns)

  //console.log(projetos.columns, projetos[0]);
    ///console.table(dados);
    //console.log(Object.keys(dados[0]));
    //console.log(d3.keys(dados[0]));
    //console.log(d3.map(dados, d => d.Classificador).keys());
    //console.log(dados
    //    .map(d => d.Classificador)
    //    .filter((v, i, a) => a.indexOf(v) === i));

    const classificadores = dados
      .map(d => d.Classificador)
      .filter((v, i, a) => a.indexOf(v) === i);
    
    const entidades_classificadores = dados
      .map(d => ({"entidade": d.Inicio,
                  "classificador": d.Classificador
                }))
      .filter((v, i, a) => a.indexOf(v) === i);

    //console.table("hi", classificadores);

    // popular os <select>

    const $menu_classificador = d3.select("#menu-classificador");
    const $menu_entidade = d3.select("#menu-entidade");

    const $menu_classificador_options = $menu_classificador
      .selectAll("option.populados")
      .data(classificadores)
      .enter()
      .append("option")
      .classed("populados", true)
      .property("value", d => d)
      .text(d => d);

    const $menu_entidade_options = $menu_entidade
      .selectAll("option.populados")
      .data(entidades_classificadores, d => d.classificador + d.entidade)
      .enter()
      .append("option")
      .classed("populados", true)
      .property("value", d => d.classificador + d.entidade)
      .text(function(d) {
        if (d.entidade == "Rio de Janeiro" || d.entidade == "Sao Paulo")
          return (d.entidade + " (" + d.classificador.substring(0, d.classificador.length-1) + ")")
        else
          return d.entidade});

    // atualiza menu conforme seleção

    $menu_classificador.on("change", function() {
        const valor_selecionado = $menu_classificador.property("value");
        //console.log("Estou na mudança", valor_selecionado);

        const entidades_classificadores_filtrado = entidades_classificadores.filter(d => d.classificador == valor_selecionado);
        //entidades_classificadores_filtrado.sort((a, b) => a.entidade < b.entidade);
        
        $menu_entidade_options.style("display", "none");

        const menu_entidade_options_atualizado = $menu_entidade_options
          .data(entidades_classificadores_filtrado, d => d.classificador + d.entidade)
          .style("display", "unset");      
    })

    // atualiza valores

    $menu_entidade.on("change", function() {

        const valor_selecionado = $menu_entidade.property("value");
        
        const dados_filtrados = dados.filter(d => d.Classificador + d.Inicio == valor_selecionado)[0];
        //console.log("dados", dados_filtrados);

        // exibe o quadr0
        d3.select('section.quadro div.card')
          .classed("opaque", false);

        // atualiza tabela

        const $campos_de_valor = d3.selectAll("section.quadro .card table td");
        //console.log($campos_de_valor);

        $campos_de_valor._groups[0].forEach(function(d) {
            const valor = dados_filtrados[d.id];

            //console.log(d.id, d, dados_filtrados[d.id]);

            if (d.id == "ATM_Total") d.textContent = dados_filtrados[d.id] == "NA" ? "" : formataBR_1(dados_filtrados[d.id]) + " anos"
            else
                if (d.id == "Custo_Total") d.textContent = dados_filtrados[d.id] == "NA" ? "" : dados_filtrados[d.id]
                else d.textContent = (dados_filtrados[d.id] == 0) ? 0: formata_vlr_tooltip(dados_filtrados[d.id]);
        });

        draw_grafico_card(dados_filtrados);
        

        // agora a tabela de projetos

        const projetos_filtrados = projetos.filter(d => d.Classificador + d.Inicio == valor_selecionado);
        
        //console.table(projetos_filtrados);

        monta_tabela_projetos(projetos_filtrados);

        



        });


    // escala



    


                
});

