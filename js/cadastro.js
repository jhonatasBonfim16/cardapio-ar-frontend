// Variável de controle: 'login' ou 'cadastro'
let modoAuthAtual = 'cadastro';

function abrirAuth() {
    document.getElementById('modal-auth').classList.add('ativo');
}

function fecharAuth() {
    document.getElementById('modal-auth').classList.remove('ativo');
}

function alternarModoAuth() {
    const titulo = document.getElementById('auth-titulo');
    const wrapperNome = document.getElementById('wrapper-nome');
    const btnEnviar = document.getElementById('btn-auth-enviar');
    const linkAlternar = document.getElementById('auth-alternar');
    const inputNome = document.getElementById('auth-nome');

    if (modoAuthAtual === 'cadastro') {
        modoAuthAtual = 'login';
        titulo.innerText = 'Entrar no Sistema';
        wrapperNome.style.display = 'none';
        inputNome.removeAttribute('required');
        btnEnviar.innerText = 'Entrar';
        linkAlternar.innerText = 'Não tem conta? Cadastre-se aqui'; // Correto: convida a ir para o cadastro
    } else {
        modoAuthAtual = 'cadastro';
        titulo.innerText = 'Criar uma Conta';
        wrapperNome.style.display = 'block';
        inputNome.setAttribute('required', 'true');
        btnEnviar.innerText = 'Criar Conta';
        linkAlternar.innerText = 'Já tem conta? Faça login aqui'; // Correto: convida a ir para o login
    }

}

// Envio de dados para a sua API usando cookies (credentials: 'include')
async function enviarAutenticacao(event) {
    event.preventDefault();

    const nome = document.getElementById('auth-nome').value;
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-senha').value;

    // 1. Pegue a URL base da sua API do Render (Exemplo: https://cardapio-api.onrender.com)
    const API_URL = 'https://cardapio-ar-backend.onrender.com';

    // 2. Ajuste a lógica do seu código para concatenar as rotas certas:
    const urlRota = modoAuthAtual === 'cadastro'
        ? `${API_URL}/api/usuario`
        : `${API_URL}/api/usuario/login`;

    const corpoRequisicao = modoAuthAtual === 'cadastro'
        ? { nome, email, password }
        : { email, password };

    try {
        const resposta = await fetch(urlRota, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpoRequisicao),
            credentials: 'include' // Essencial para o envio dos cookies seguros
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert('Bem-vindo de volta!');
            
            // [ADICIONADO]: Cria um cookie manual no navegador válido por 7 dias
            const diasParaExpirar = 7;
            const dataExpiracao = new Date();
            dataExpiracao.setTime(dataExpiracao.getTime() + (diasParaExpirar * 24 * 60 * 60 * 1000));
            
            document.cookie = `token_cardapio=${dados.token}; expires=${dataExpiracao.toUTCString()}; path=/; SameSite=Lax`;
            
            fecharAuth();
        }

    } catch (erro) {
        console.error(erro);
        alert('Erro de conexão com o servidor de autenticação.');
    }
}
