// Array em memória para salvar os itens e dados da sacola de compras
let iconLixeira = document.getElementById("iconLixeira")
let carrinho = [];
let categoriaAtual = '';

// Função Reativa que gerencia a adição e soma de itens
function adicionarAoPedido(id, nomePrato, precoOriginal) {
    // Verifica se o item já está no carrinho
    const itemExistente = carrinho.find(item => item.id === id);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({
            id: id,
            nome: nomePrato,
            preco: precoOriginal,
            quantidade: 1
        });
    }

    atualizarBadgeCarrinho();
    alert(`🛒 ${nomePrato} adicionado à sua sacola!`);   // Criar uma tela de sucesso
}

function atualizarBadgeCarrinho() {
    // CORREÇÃO CRÍTICA AQUI: Removido o 'sCategory' que quebrava o interpretador JS
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    const badge = document.getElementById('contador-carrinho');

    if (badge) {
        badge.innerText = totalItens;
        if (totalItens > 0) {                                   // criar remover pedido
            badge.classList.add('visivel');
            badge.classList.add('pulso');
            setTimeout(() => badge.classList.remove('pulso'), 200);
        } else {
            badge.classList.remove('visivel');
        }
    }
}

// Funções de Controle do Modal do Carrinho
function abrirCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    modal.classList.add('ativo');
    renderizarItensCarrinho();
}

function fecharCarrinho() {
    const modal = document.getElementById('modal-carrinho');
    modal.classList.remove('ativo');
}

function renderizarItensCarrinho() {
    const container = document.getElementById('itens-carrinho');
    const totalTxt = document.getElementById('preco-total-carrinho');
    container.innerHTML = '';

    if (carrinho.length === 0) {
        container.innerHTML = `<p class="carrinho-vazio">Sua sacola está vazia.</p>`;
        totalTxt.innerText = "R\$ 0,00";
        return;
    }

    // Zere o container antes de renderizar para não duplicar itens antigos
    container.innerHTML = "";
    let valorTotalGeral = 0;

    carrinho.forEach((item, index) => {
        const subtotal = item.preco * item.quantidade;
        valorTotalGeral += subtotal;

        container.innerHTML += `
        <div id="item-${index}" class="item-carrinho-linha">
            <div>
                <h4>${item.nome}</h4>
                <small>R$ ${item.preco.toFixed(2).replace('.', ',')} x ${item.quantidade}</small>
            </div>

            <strong>R$ ${subtotal.toFixed(2).replace('.', ',')}</strong>                
            <div>
                <img src="https://spxiyxxvconegivsvjam.supabase.co/storage/v1/object/public/cardapio-midia/lixeira%20icon.png" 
                     width="18px" 
                     height="18px" 
                     onclick="lixeira(${index})" 
                     style="cursor: pointer;">
            </div>
        </div>
    `;
    });

    totalTxt.innerText = `R$ ${valorTotalGeral.toFixed(2).replace('.', ',')}`;

}
function lixeira(id) {
    carrinho.pop(id)
    renderizarItensCarrinho()
}


function alternarCamposPedido(tipo) {
    const input = document.getElementById('input-identificador');
    if (tipo === 'mesa') {
        input.type = 'number';
        input.placeholder = 'Digite o número da sua mesa';
        input.value = '';
    } else {
        input.type = 'text';
        input.placeholder = 'Digite seu endereço de entrega';
        input.value = '';
    }
}


////////////////////////////////////////////////////////////////////////
// Envio Inteligente do Pedido Final
// FUNÇÃO DE HIGIENIZAÇÃO (Anti-XSS e remoção de código malicioso)
function higienizarEntrada(texto) {
    if (!texto) return '';

    return texto
        .replace(/<[^>]*>/g, '') // Remove qualquer tag HTML/Script completamente (ex: <script> virará vazio)
        .replace(/&/g, "&amp;")  // Escapa caracteres especiais de HTML
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;")
        .trim();                 // Remove espaços extras nas pontas
}







const API_PRODUCAO = "https://cardapio-ar-backend.onrender.com";

// Envio Inteligente do Pedido Final (Seu código atualizado) colocar no backend.
async function enviarPedidoFinal() {
    const apiHost = API_PRODUCAO;
    // Injeta dinamicamente a query string
    const url_pedidos = `${apiHost}/api/pedido`;

    if (carrinho.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }

    const inputBruto = document.getElementById('input-identificador').value;
    const inputVal = higienizarEntrada(inputBruto);
    const tipoPedido = document.querySelector('input[name="tipo-pedido"]:checked').value;

    // Captura o método de pagamento selecionado no HTML
    const formaPagamento = document.querySelector('input[name="metodo-pagamento"]:checked').value;

    if (!inputVal) {
        alert("Por favor, preencha o campo de identificação/endereço obrigatório com caracteres válidos.");
        return;
    }

    const dados = {
        tipoPedido: tipoPedido,
        inputVal: inputVal,
        carrinho: carrinho,
        formaPagamento: formaPagamento
    };

    // Função auxiliar para pegar o valor do cookie no Front-end
    function obterCookie(nome) {
        const valor = `; ${document.cookie}`;
        const partes = valor.split(`; ${nome}=`);
        if (partes.length === 2) return partes.pop().split(';').shift();
    }

    const tokenLogado = obterCookie('token_cardapio');

    try {
        const sendApi = await fetch(url_pedidos, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tokenLogado}` // Enviando o token via cabeçalho padrão
            },
            body: JSON.stringify(dados)
        });

        // Se a API retornar 401, barra o fluxo e manda para o login
        if (sendApi.status === 401) {
            alert("Para finalizar o seu pedido e selecionar o método de pagamento, você precisa estar conectado à sua conta.");
            fecharCarrinho();
            abrirAuth();
            return; // Para a execução com segurança sem limpar o carrinho
        }

        const response = await sendApi.json();

        if (!sendApi.ok) {
            alert(response.message || "Erro ao processar pedido.");
            return;
        }

        // =========================================================================
        // [CORRIGIDO]: O fluxo agora divide o comportamento perfeitamente!
        // =========================================================================

        if (formaPagamento === 'pix' && response.pixCopiaCola) {
            // 1. Se for PIX: Apenas abre o Modal com o QR Code na tela.
            // O WhatsApp NÃO abre agora. Ele fica em silêncio aguardando o pagamento.
            fecharCarrinho();
            document.getElementById('qrcode-pix').src = response.pixQrCodeBase64;
            document.getElementById('input-copia-cola').value = response.pixCopiaCola;
            document.getElementById('modal-pagamento').classList.add('ativo');

            // Inicia o Polling. Quando detectar o pagamento, a função 'verificarStatusPagamento' abrirá o Zap!
            if (typeof verificarStatusPagamento === "function") {
                verificarStatusPagamento(response.pedidoId);
            }
        } else {
            // 2. Se for CARTÃO ou DINHEIRO: Abre o WhatsApp IMEDIATAMENTE enviando para a cozinha.
            alert("Pedido recebido com sucesso! Encaminhando o resumo para o WhatsApp da cozinha...");
            window.open(`https://wa.me/${dados.numeroWhats}?text=${encodeURIComponent(dados.textoMensagem)}`, '_blank');
            fecharCarrinho();
        }

        // Limpa a sacola após o sucesso total do envio
        carrinho = [];
        atualizarBadgeCarrinho();



    } catch (err) {
        console.log("Erro ao enviar dados.:", err);
        alert("Erro de comunicação com o servidor. O carrinho não foi esvaziado.");
    }
}








function fecharModalPagamento() {
    document.getElementById('modal-pagamento').classList.remove('ativo');
}
function fecharModalPagamento() {
    // Para o cronômetro do Polling para não gastar requisições no Render
    clearInterval(intervaloPollingPix);

    // Remove a classe para esconder o modal da tela
    document.getElementById('modal-pagamento').classList.remove('ativo');
}


function copiarPixCopiaCola() {
    const input = document.getElementById('input-copia-cola');
    if (!input.value) return;
    input.select();
    input.setSelectionRange(0, 99999);
    navigator.clipboard.writeText(input.value);
    alert("Código Pix Copia e Cola copiado com sucesso!");
}

/////////////////////////////////////////////////////////////////////////////

// LÓGICA DE FILTRAGEM REATIVA POR CATEGORIAS
function alternarCategoria(elemento, categoria) {
    // Altera a classe visual ativa no menu horizontal
    document.querySelectorAll('.categoria-item').forEach(aba => aba.classList.remove('ativo'));
    elemento.classList.add('ativo');

    categoriaAtual = categoria;
    carregarCardapio(); // Re-chama o fetch aplicando a rota filtrada no Postgres
}

                
async function carregarCardapio() {
    try {
        const apiHost = API_PRODUCAO;

        // Injeta dinamicamente a query string se houver categoria ativa
        const urlFinal = categoriaAtual ? `${apiHost}/api/cardapio?categoria=${categoriaAtual}` : `${apiHost}/api/cardapio`;

        const response = await fetch(urlFinal);
        const pratos = await response.json();

        const container = document.getElementById('lista-cardapio');
        container.innerHTML = '';

        if (!Array.isArray(pratos)) {
            console.error("A API não retornou uma lista válida de pratos.");
            return;
        }

        // [OTIMIZAÇÃO CRUCIAL]: Criamos uma string única acumulando todos os cards
        let htmlAcumulado = '';

        pratos.forEach((prato, index) => {
            try {
                const id = prato.id || index;
                const nome = prato.nome || 'Prato sem nome';
                const descricao = prato.descricao || 'Sem descrição cadastrada.';

                const precoNum = parseFloat(prato.preco);
                const precoFormatado = !isNaN(precoNum) ? precoNum.toFixed(2).replace('.', ',') : '0,00';

                const urlModelo = "https://modelviewer.dev/shared-assets/models/Astronaut.glb" //prato.modelo_3d_url || prato.modelo3d || '';
                const urlModelo3d_ios = prato.modelo3d_ios || '';
                const urlFoto = prato.imagem_url || prato.foto || '';
                const nomeEscapado = nome.replace(/'/g, "\\'");

                // Concatenamos o HTML puro na string de templates
                htmlAcumulado += `
                    <div class="card">
                        <div class="viewport-ar">
                        <model-viewer 
                            src="${urlModelo}" 
                            ios-src="${urlModelo3d_ios}" 
                            <!--data-src-real="${urlModelo}" -->
                            <!-- data-ios-src-real="${urlModelo3d_ios}" -->
                            ar                         
                            ar-scale="fixed" 
                            ar-modes="webxr quick-look scene-viewer"
                            camera-controls 
                            touch-action="pan-y"
                            shadow-intensity="1"
                            exposure="1.2"
                            alt="Modelo 3D de ${nome}">
                            
                            <button slot="ar-button" class="btn-ar">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18a2.25 2.25 0 01-2.25 2.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Ver em 3D
                            </button>
                        </model-viewer> 
                        </div>
                        
                        <div class="card-detalhes">
                            <div class="card-header">
                                <div>
                                    <h2>${nome}</h2>
                                    <p>${descricao}</p>
                                </div>
                                <span class="preco">R$ ${precoFormatado}</span>
                            </div>
                            
                            <button class="btn-adicionar" onclick="adicionarAoPedido(${id}, '${nomeEscapado}', ${precoNum})">
                                Adicionar ao Pedido
                            </button>
                        </div>
                    </div>
                `;
            } catch (erroItem) {
                console.error("Erro ao processar item:", erroItem);
            }
        });

        // Injeta todo o HTML de uma vez só no DOM (Economiza muita CPU)
        container.innerHTML = htmlAcumulado;

        // 🔥 [CORREÇÃO MASTER]: Ativa o gerenciador APENAS UMA VEZ após todo o HTML estar pronto no navegador
       // ativarGerenciadorDeMemoriaAR();

    } catch (erro) {
        console.error("Erro na conexão com o servidor:", erro);
    }
}

// Inicializa o cardápio
carregarCardapio();

function ativarGerenciadorDeMemoriaAR() {
    const observadorAR = new IntersectionObserver((entradas) => {
        entradas.forEach(entrada => {
            const modelViewer = entrada.target;
            const urlGlb = modelViewer.dataset.srcReal;
            const urlUsdz = modelViewer.dataset.iosSrcReal;

            if (entrada.isIntersecting) {
                if (!modelViewer.getAttribute('src') && urlGlb) {
                    modelViewer.setAttribute('src', urlGlb);
                    if (urlUsdz) {
                        modelViewer.setAttribute('ios-src', `${urlUsdz}#allowsContentScaling=0`);
                    }
                }
            } else {
                if (modelViewer.getAttribute('src')) {
                    modelViewer.removeAttribute('src');
                    modelViewer.removeAttribute('ios-src');
                }
            }
        });
    }, {
        root: null,
        // 🎯 [AJUSTE DE PERFORMANCE]: Mudamos para "100px 0px". Margens negativas como (-10%) 
        // dizem ao navegador para cortar a área de detecção dentro da tela, o que fazia os modelos 
        // sumirem mesmo enquanto o usuário ainda estava tentando olhar para eles se o card fosse grande!
        rootMargin: "100px 0px 100px 0px", 
        threshold: 0.0
    });

    const todosOsModelos = document.querySelectorAll('model-viewer');
    todosOsModelos.forEach(modelo => observadorAR.observe(modelo));
}



// Variável global para conseguir parar o Polling de qualquer lugar do código
let intervaloPollingPix;

function verificarStatusPagamento(pedidoId) {
    const urlCheck = `${API_PRODUCAO}/api/pedido/${pedidoId}`;

    let tentativas = 0;
    const maxTentativas = 60; // 60 tentativas * 10 segundos = 10 minutos de limite

    clearInterval(intervaloPollingPix);

    intervaloPollingPix = setInterval(async () => {
        tentativas++;

        if (tentativas > maxTentativas) {
            clearInterval(intervaloPollingPix);
            alert("O tempo para pagamento do Pix expirou. Se você já pagou, verifique com o gerente.");
            fecharModalPagamento();
            return;
        }

        try {
            const resposta = await fetch(urlCheck, { method: "GET" });

            if (resposta.ok) {
                const dados = await resposta.json();
                console.log(dados)

                // 🔥 O MOMENTO DO SUCESSO: DETECTOU QUE FOI PAGO!
                if (dados.status === 'Pago') {
                    // 1. Para o cronômetro do Polling na hora
                    clearInterval(intervaloPollingPix);

                    // 2. Fecha a tela do QR Code do Pix
                    fecharModalPagamento();

                    // 3. Mostra o alerta de sucesso para o cliente
                    alert("✨ Pagamento Confirmado com Sucesso! ✨\nSeu pedido foi enviado para a cozinha.");

                    // 4. [CORRIGIDO]: Abre o WhatsApp enviando a mensagem contendo o texto de "PEDIDO PAGO" para a cozinha!
                    window.open(`https://wa.me/${dados.numeroWhats}?text=${encodeURIComponent(dados.textoMensagem)}`, '_blank');
                }
            }
        } catch (erro) {
            console.log("Erro ao checar status do Pix (Polling):", erro);
        }
    }, 10000); // Mantido o tempo de 10 segundos seguro contra o erro 429
}



////


function atualizarStatusFuncionamento() {
    const elementoStatus = document.getElementById('status-loja');
    if (!elementoStatus) return;

    const agora = new Date();
    const diaSemana = agora.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    const hora = agora.getHours();
    const minuto = agora.getMinutes();
    
    // Converte a hora atual em minutos totais desde o início do dia para facilitar o cálculo
    // Ex: 18h30 = 18 * 60 + 30 = 1110 minutos
    const minutosAtuais = (hora * 60) + minuto;

    const inicioMinutos = 18 * 60;       // 18h00 em minutos (1080)
    const fimMinutos = (23 * 60) + 30;   // 23h30 em minutos (1410)
    const avisoBreveMinutos = fimMinutos - 30; // 23h00 em minutos (Falta 30 min para fechar)

    // Segunda-feira (dia 1) o restaurante fecha o dia todo
    if (diaSemana === 1) {
        elementoStatus.innerText = "Fechado agora";
        elementoStatus.className = "status-loja-box status-fechado";
        return;
    }

    // Verifica se está dentro do horário de funcionamento (18h às 23h30)
    if (minutosAtuais >= inicioMinutos && minutosAtuais < fimMinutos) {
        // Se faltar 30 minutos ou menos para fechar (entre 23h00 e 23h30)
        if (minutosAtuais >= avisoBreveMinutos) {
            elementoStatus.innerText = "Fechar em breve";
            elementoStatus.className = "status-loja-box status-breve";
        } else {
            // Horário normal de funcionamento
            elementoStatus.innerText = "Aberto agora";
            elementoStatus.className = "status-loja-box status-aberto";
        }
    } else {
        // Fora do horário
        elementoStatus.innerText = "Fechado agora";
        elementoStatus.className = "status-loja-box status-fechado";
    }
}

// Executa a função imediatamente ao carregar o script
atualizarStatusFuncionamento();
// Atualiza a cada 1 minuto caso o cliente fique com o cardápio aberto no celular
setInterval(atualizarStatusFuncionamento, 60000);





////



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
        if(sol) sol.style.display = 'block';
        if(lua) lua.style.display = 'none';

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
        if(linkAlternarAuth) linkAlternarAuth.style.setProperty('color', '#ff7a45', 'important');
        if(precoTotalSacola) precoTotalSacola.style.setProperty('color', '#ff7a45', 'important');

        // Mantém os nomes dos pratos na sacola em Branco para contraste
        nomesPratosSacola.forEach(el => el.style.setProperty('color', '#f5f5f7', 'important'));
        textosSecundarios.forEach(el => el.style.setProperty('color', '#b3b3b3', 'important'));

        // Força os labels do formulário de login se eles existirem
        const labelsAuth = document.querySelectorAll('#form-auth label');
        labelsAuth.forEach(el => el.style.setProperty('color', '#ff7a45', 'important'));

    } else {
        localStorage.setItem('tema_preferido', 'light');
        
        // Faz o Sol sumir e a Lua cair elástica do topo através do @keyframes do CSS
        if(sol) sol.style.display = 'none';
        if(lua) lua.style.display = 'block';

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
        
        if(linkAlternarAuth) linkAlternarAuth.style.setProperty('color', '#ff5722', 'important');
        if(precoTotalSacola) precoTotalSacola.style.setProperty('color', '#e65100', 'important');

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
