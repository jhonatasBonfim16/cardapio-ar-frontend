
// FUNÇÃO PARA DETECTAR E APLICAR O TEMA CORRETO
function inicializarTema() {
    const temaSalvo = localStorage.getItem('tema_preferido');
    const sistemaModoEscuro = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Se o usuário preferir dark, força a execução do bloco dark
    if (temaSalvo === 'dark' || (!temaSalvo && sistemaModoEscuro)) {
        document.body.classList.add('dark');
    }

    // Roda a função uma vez para pintar as telas na cor correta de primeira
    alternarTemaManual();
    // Desfaz o toggle caso ele tenha invertido a preferência inicial
    if (temaSalvo === 'light' || (!temaSalvo && !sistemaModoEscuro)) {
        document.body.classList.remove('dark');
        alternarTemaManual();
    }
}


// FUNÇÃO CHAMADA AO CLICAR NO BOTÃO DO TOPO
function alternarTemaManual() {
    const corpoElemento = document.body;
    const sol = document.getElementById('icone-sol');
    const lua = document.getElementById('icone-lua');

    // 1. Liga ou desliga a classe .dark do body
    corpoElemento.classList.toggle('dark');

    // 2. Coleta de elementos com seletores isolados e seguros
    const modalContainers = document.querySelectorAll('.modal-container');
    const inputsDigitacao = document.querySelectorAll('.campo-input-container input');
    const opcoesEntrega = document.querySelectorAll('.opcoes-entrega');
    const titulosModais = document.querySelectorAll('.modal-header h2, .modal-footer label');
    const nomesPratosSacola = document.querySelectorAll('.item-carrinho-linha h4, .total-container');
    const textosSecundarios = document.querySelectorAll('.item-carrinho-linha small, .btn-fechar');

    // Elementos laranjas isolados por ID
    const linkAlternarAuth = document.getElementById('auth-alternar');
    const precoTotalSacola = document.querySelector('.total-container strong');

    if (corpoElemento.classList.contains('dark')) {
        localStorage.setItem('tema_preferido', 'dark');

        // Ativa os displays e dispara a animação de rotação do Sol
        if (sol) sol.style.display = 'block';
        if (lua) lua.style.display = 'none';

        // =========================================================================
        // FORÇAR MODO ESCURO REAL (CORES DE ALTO CONTRASTE NEON)
        // =========================================================================
        corpoElemento.style.backgroundColor = '#0f0f11';
        corpoElemento.style.color = '#f5f5f7';

        modalContainers.forEach(el => el.style.setProperty('background-color', '#16161a', 'important'));
        opcoesEntrega.forEach(el => el.style.setProperty('background-color', '#1c1c21', 'important'));

        inputsDigitacao.forEach(el => {
            el.style.setProperty('background-color', '#1c1c21', 'important');
            el.style.setProperty('color', '#f5f5f7', 'important');
            el.style.setProperty('border-color', '#2b2b33', 'important');
        });

        // Aplica o Laranja Neon nos Títulos para dar o visual futurista premium
        titulosModais.forEach(el => el.style.setProperty('color', '#ff7a45', 'important'));
        if (linkAlternarAuth) linkAlternarAuth.style.setProperty('color', '#ff7a45', 'important');
        if (precoTotalSacola) precoTotalSacola.style.setProperty('color', '#ff7a45', 'important');

        // Mantém os nomes dos pratos na sacola em Branco para contraste
        nomesPratosSacola.forEach(el => el.style.setProperty('color', '#f5f5f7', 'important'));
        textosSecundarios.forEach(el => el.style.setProperty('color', '#b3b3b3', 'important'));

        // Força os labels do formulário de login se eles existirem
        const labelsAuth = document.querySelectorAll('#form-auth label');
        labelsAuth.forEach(el => el.style.setProperty('color', '#ff7a45', 'important'));

    } else {
        localStorage.setItem('tema_preferido', 'light');

        // Faz o Sol sumir e a Lua cair elástica do topo através do @keyframes do CSS
        if (sol) sol.style.display = 'none';
        if (lua) lua.style.display = 'block';

        // =========================================================================
        // RETORNAR AO MODO CLARO ORIGINAL AREIA
        // =========================================================================
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

        if (linkAlternarAuth) linkAlternarAuth.style.setProperty('color', '#ff5722', 'important');
        if (precoTotalSacola) precoTotalSacola.style.setProperty('color', '#e65100', 'important');

        const labelsAuth = document.querySelectorAll('#form-auth label');
        labelsAuth.forEach(el => el.style.setProperty('color', '#6d4c41', 'important'));
    }
}




// Escuta mudanças automáticas se o usuário alterar as configurações do próprio celular no meio do uso
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!localStorage.getItem('tema_preferido')) {
        inicializarTema();
    }
});

// Executa automaticamente ao ler o script para o app abrir na cor certa instantaneamente
inicializarTema();