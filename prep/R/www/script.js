

const conceitos = document.getElementsByClassName('conceito');
const descricoes = document.getElementsByClassName('descricao');

let clicados = {};

for (let i = 0; i < descricoes.length; i++) {
    descricoes[i].style.display = "none";
}

document.addEventListener('click', function (event) {
    
    if (event.target.matches('.conceito')) {
        let idConceito = event.target.id;
        console.log("clicou em", idConceito);

        identificador = idConceito.substring(idConceito.indexOf("-")+1);

        let idDescricao = "descricao-" + identificador;
        console.log("vou pegar o ", idDescricao);
        let descricao = document.getElementById(idDescricao);
        console.log("selecionou o ", descricao);

        if (!(identificador in clicados)) {
            clicados[identificador] = false;
        } 

        if (clicados[identificador]) {
            descricao.style.display = 'none';
        } else {
            descricao.style.display = '';
        }

        clicados[identificador] = !(clicados[identificador]);

        console.log(identificador, idConceito, idDescricao, clicados[identificador])

    } else if (event.target.matches('.link-fechar')) {

        let idFechar = event.target.id;
        console.log("clicou em", idFechar);

        identificador = idFechar.substring(idFechar.indexOf("-")+1);

        let idDescricao = "descricao-" + identificador;
        console.log("vou pegar o ", idDescricao);
        let descricao = document.getElementById(idDescricao);
        console.log("selecionou o ", descricao);

        descricao.style.display = 'none';
        clicados[identificador] = false;

    }     
}
);
