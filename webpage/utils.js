// funcaozinha para gerar rotulos

const localeBrasil = {
  "decimal": ",",
  "thousands": ".",
  "grouping": [3],
  "currency": ["R$", ""]};

//https://cdn.jsdelivr.net/npm/d3-time-format@2/locale/pt-BR.json
const localeDataBrasil = {
  "dateTime": "%A, %e de %B de %Y. %X",
  "date": "%d/%m/%Y",
  "time": "%H:%M:%S",
  "periods": ["AM", "PM"],
  "days": ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"],
  "shortDays": ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
  "months": ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
  "shortMonths": ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
}

const formataBR   = d3.formatDefaultLocale(localeBrasil).format(",.0f");
const formataBR_1 = d3.formatDefaultLocale(localeBrasil).format(",.1f");

const multiplos = [1, 1e3, 1e6, 1e9, 1e12];
const sufixo    = ["", "mil", "mi", "bi", "tri"];
const obj_mult = multiplos.map((d,i) => ({
  valor: d,
  sufixo: sufixo[i]
}));
//console.log("objeto multiplos", obj_mult)

const valor_formatado = function(x) {
  for (mult of obj_mult) {
    const val = x/mult.valor;
    if (val < 1000) return formataBR_1(val) + " " + mult.sufixo;
  }
}

// datas

d3.timeFormatDefaultLocale(localeDataBrasil);

const formataData = d3.timeFormat("%b %Y");
console.log(formataData(new Date))
const formataData_Anos = d3.timeFormat("%Y");

// para gerar arco para anotações
function gera_arco(x1,y1,x2,y2) {
  xmin = Math.min(x1,x2);
  xmax = Math.max(x1,x2);
  ymin = Math.min(y1,y2);
  xb = xmax - Math.abs(x2-x1)/6;
  yb = ymin + Math.abs(y2-y1)/6;
  path = "M" + x1 + "," + y1 + " Q" + xb + "," + yb + " " + x2 + "," + y2;
  console.log(path)
  return path;
}

function gera_grid(svg_ref, step) {
  const w = svg_ref.attr("width");
  const h = svg_ref.attr("height");
  console.log("svg dimensions", w, h);
  const selecao = svg_ref.append("g").classed("grid-help", true);
  for (let tick = 0; tick <= w; tick += step) {
    selecao.append("line")
      .attr("x1", tick)
      .attr("x2", tick)
      .attr("y1", 0)
      .attr("y2", h)
      .attr("stroke-width", 1)
      .attr("stroke", "lime");
    selecao.append("text")
      .attr("x", tick)
      .attr("y", 20)
      .text(tick)
      .attr("font-size", 8)
      .attr("font-weight", 100)
      .style("color", "lime");
  }
  for (let tick = 0; tick <= h; tick += step) {
    selecao.append("line")
      .attr("x1", 0)
      .attr("x2", w)
      .attr("y1", tick)
      .attr("y2", tick)
      .attr("stroke-width", 1)
      .attr("stroke", "lime");
    selecao.append("text")
      .attr("x", 10)
      .attr("y", tick)
      .text(tick)
      .attr("font-size", 8)
      .style("color", "lime");
  }
}



// função debounce para dar um atraso na chamada do resize
// https://davidwalsh.name/function-debounce
const debounce = function(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this, args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};