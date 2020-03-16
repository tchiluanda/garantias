// funcaozinha para gerar rotulos

const localeBrasil = {
  "decimal": ",",
  "thousands": ".",
  "grouping": [3],
  "currency": ["R$", ""]};

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