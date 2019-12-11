
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

const w_svg_card = w_container_card > 400 ? 400 : w_container_card;
const h_svg_card = 300;

const margin = {
  "top": 20,
  "bottom": 20,
  "left": 100,
  "right": 30
};

const $svg_card = d3.select('svg.card');

$svg_card      
  .attr('width', w_svg_card)
  .attr('height', h_svg_card);

const draw_grafico_card = function(dados_selecionados) {
  
  const mini_dataset = periodos_maturacao["rotulos"]
    .map( (d,i) => ({
      "rotulo" : d,
      "valor": +dados_selecionados[periodos_maturacao["valores"][i]],
      "valor_percentual": dados_selecionados[periodos_maturacao["percentual"][i]] 
    }));
  
  const valor_maximo_mini = d3.max(mini_dataset, d => d.valor);

  const escala_valor = d3.scaleLinear()
    .domain([0, valor_maximo_mini])
    .range([margin.left, w_svg_card - margin.right]);

  //console.log("valor maximo", valor_maximo_mini, escala_valor(valor_maximo_mini));
  console.log("classificador", dados_selecionados, dados_selecionados.Classificador);
  
  const escala_rotulos = d3.scaleBand()
    .domain(periodos_maturacao["rotulos"])
    .range([margin.top, h_svg_card - margin.bottom]);

  const rects = $svg_card.selectAll("rect")
    .data(mini_dataset);

  const rects_enter = rects
    .enter()
    .append('rect')
    .attr('x', margin.left)
    .attr('y', d => escala_rotulos(d.rotulo))
    .attr('height', 10)
    .attr('width', 0)
    .attr('fill', "#444");
  
  const rects_update = rects.merge(rects_enter)
    .transition()
    .duration(500)
    .attr('x', margin.left)
    .attr('y', d => escala_rotulos(d.rotulo))
    .attr('height', 10)
    .attr('width', d => escala_valor(d.valor))
    .attr('fill', fillColor(dados_selecionados.Classificador));
  
  const rotulos_y = $svg_card.


  console.log("Mini dataset", mini_dataset);


}

// *********************
// PARTE 2 - Leitura dos dados e inicio
// *********************

d3.csv("webpage/dados_quadro.csv").then(function(dados) {
    console.table(dados);
    console.log(Object.keys(dados[0]));
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

    console.table(entidades_classificadores);

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
        if (d.entidade == "Rio de Janeiro" || d.entidade == "São Paulo")
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
        console.log("dados", dados_filtrados);

        // atualiza tabela

        const $campos_de_valor = d3.selectAll("section.quadro table td");
        //console.log($campos_de_valor);

        $campos_de_valor._groups[0].forEach(function(d) {
            const valor = dados_filtrados[d.id];

            //console.log(d.id, d, dados_filtrados[d.id]);

            if (d.id == "ATM_Total") d.textContent = dados_filtrados[d.id] == "NA" ? "" : formataBR(dados_filtrados[d.id]) + " anos"
            else
                if (d.id == "Custo_Total") d.textContent = dados_filtrados[d.id] == "NA" ? "" : dados_filtrados[d.id]
                else d.textContent = (dados_filtrados[d.id] == 0) ? 0: formata_vlr_tooltip(dados_filtrados[d.id]);
        });

        draw_grafico_card(dados_filtrados);




        });


    // escala



    


                
});

