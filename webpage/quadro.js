


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

    // formatação valores
    
    const localeBrasil = {
        "decimal": ",",
        "thousands": ".",
        "grouping": [3],
        "currency": ["R$", ""]};

    const formataBR = d3.formatDefaultLocale(localeBrasil).format(",.2f");

    const formata_vlr_tooltip = function(val){
        return "R$ "+formataBR(val/1e6)+" mi"
    }

    $menu_entidade.on("change", function() {

        const valor_selecionado = $menu_entidade.property("value");
        
        const dados_filtrados = dados.filter(d => d.Classificador + d.Inicio == valor_selecionado)[0];
        console.log("dados", dados_filtrados);

        const $campos_de_valor = d3.selectAll("section.quadro table td");
        //console.log($campos_de_valor);

        $campos_de_valor._groups[0].forEach(function(d) {
            const valor = dados_filtrados[d.id];

            console.log(d.id, d, dados_filtrados[d.id]);

            if (d.id == "ATM_Total") d.textContent = dados_filtrados[d.id] == "NA" ? "" : formataBR(dados_filtrados[d.id]) + " anos"
            else
                if (d.id == "Custo_Total") d.textContent = dados_filtrados[d.id] == "NA" ? "" : dados_filtrados[d.id]
                else d.textContent = (dados_filtrados[d.id] == 0) ? 0: formata_vlr_tooltip(dados_filtrados[d.id]);
        });
        });


    


                
});

