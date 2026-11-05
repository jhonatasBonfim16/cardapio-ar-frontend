// Aplica um tema específico (sem inverter nada e sem salvar)
function aplicarTema(escuro) {
    const corpoElemento = document.body;
    const sol = document.getElementById('icone-sol');
    const lua = document.getElementById('icone-lua');

    corpoElemento.classList.toggle('dark', escuro);   // força o estado, não inverte

    const modalContainers = document.querySelectorAll('.modal-container');
    const inputsDigitacao = document.querySelectorAll('.campo-input-container input');
    const opcoesEntrega = document.querySelectorAll('.opcoes-entrega');
    const titulosModais = document.querySelectorAll('.modal-header h2, .modal-footer label');
    const nomesPratosSacola = document.querySelectorAll('.item-carrinho-linha h4, .total-container');
    const textosSecundarios = document.querySelectorAll('.item-carrinho-linha small, .btn-fechar');
    const labelsAuth = document.querySelectorAll('#form-auth label');

    const linkAlternarAuth = document.getElementById('auth-alternar');
    const precoTotalSacola = document.querySelector('.total-container strong');

    if (escuro) {
        if (sol) sol.style.display = 'block';
        if (lua) lua.style.display = 'none';

        corpoElemento.style.backgroundColor = '#0f0f11';
        corpoElemento.style.color = '#f5f5f7';

        modalContainers.forEach(el => el.style.setProperty('background-color', '#16161a', 'important'));
        opcoesEntrega.forEach(el => el.style.setProperty('background-color', '#1c1c21', 'important'));

        inputsDigitacao.forEach(el => {
            el.style.setProperty('background-color', '#1c1c21', 'important');
            el.style.setProperty('color', '#f5f5f7', 'important');
            el.style.setProperty('border-color', '#2b2b33', 'important');
        });

        titulosModais.forEach(el => el.style.setProperty('color', '#ff7a45', 'important'));
        labelsAuth.forEach(el => el.style.setProperty('color', '#ff7a45', 'important'));
        if (linkAlternarAuth) linkAlternarAuth.style.setProperty('color', '#ff7a45', 'important');
        if (precoTotalSacola) precoTotalSacola.style.setProperty('color', '#ff7a45', 'important');

        nomesPratosSacola.forEach(el => el.style.setProperty('color', '#f5f5f7', 'important'));
        textosSecundarios.forEach(el => el.style.setProperty('color', '#b3b3b3', 'important'));
    } else {
        if (sol) sol.style.display = 'none';
        if (lua) lua.style.display = 'block';

        corpoElemento.style.backgroundColor = '#fffaf6';
        corpoElemento.style.color = '#2c1a11';

        modalContainers.forEach(el => el.style.setProperty('background-color', '#fff9f5', 'important'));
        opcoesEntrega.forEach(el => el.style.setProperty('background-color', '#ffffff', 'important'));

        inputsDigitacao.forEach(el => {
            el.style.setProperty('background-color', '#ffffff', 'important');
            el.style.setProperty('color', '#2c1a11', 'important');
            el.style.setProperty('border-color', '#ffebe0', 'important');
        });

        titulosModais.forEach(el => el.style.setProperty('color', '#2c1a11', 'important'));
        nomesPratosSacola.forEach(el => el.style.setProperty('color', '#2c1a11', 'important'));
        textosSecundarios.forEach(el => el.style.setProperty('color', '#6d4c41', 'important'));
        labelsAuth.forEach(el => el.style.setProperty('color', '#6d4c41', 'important'));

        if (linkAlternarAuth) linkAlternarAuth.style.setProperty('color', '#ff5722', 'important');
        if (precoTotalSacola) precoTotalSacola.style.setProperty('color', '#e65100', 'important');
    }
}

// Chamada pelo botão do topo: inverte e SALVA a escolha
function alternarTemaManual() {
    const vaiFicarEscuro = !document.body.classList.contains('dark');
    aplicarTema(vaiFicarEscuro);
    try {
        localStorage.setItem('tema_preferido', vaiFicarEscuro ? 'dark' : 'light');
    } catch (e) {}
}

// Chamada ao abrir a página: só aplica, nunca inverte nem salva
function inicializarTema() {
    let temaSalvo = null;
    try { temaSalvo = localStorage.getItem('tema_preferido'); } catch (e) {}

    const sistemaEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const escuro = temaSalvo ? temaSalvo === 'dark' : sistemaEscuro;
    aplicarTema(escuro);
}

// Segue o tema do celular só se o usuário nunca escolheu manualmente
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let temaSalvo = null;
    try { temaSalvo = localStorage.getItem('tema_preferido'); } catch (err) {}
    if (!temaSalvo) aplicarTema(e.matches);
});

inicializarTema();