// Array em memória para salvar os itens e dados da sacola de compras
let iconLixeira = document.getElementById("iconLixeira")
let carrinho = [];
let categoriaAtual = '';

const API_PRODUCAO = "https://cardapio-ar-backend.onrender.com";

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

        pratos.forEach((prato, index) => {
            try {
                const id = prato.id || index;
                const nome = prato.nome || 'Prato sem nome';
                const descricao = prato.descricao || 'Sem descrição cadastrada.';

                const precoNum = parseFloat(prato.preco);
                const precoFormatado = !isNaN(precoNum) ? precoNum.toFixed(2).replace('.', ',') : '0,00';

                const urlModelo = prato.modelo_3d_url || prato.modelo3d || '';
                const urlModelo3d_ios = prato.modelo3d_ios || '';
                const urlFoto = prato.imagem_url || prato.foto || '';
                const nomeEscapado = nome.replace(/'/g, "\\'");

                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';
                cardDiv.innerHTML = `
                    <div class="viewport-ar">
                    <model-viewer 
                        data-src-real="${urlModelo}" 
                        data-ios-src-real="${urlModelo3d_ios}" 
                        ar                         
                        ar-scale="fixed" 
                        ar-modes="webxr quick-look scene-viewer" 
                        camera-controls 
                        interaction-prompt="none" 
                        loading="lazy"
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
                `;
                    
                
                container.appendChild(cardDiv);
            } catch (erroItem) {
                console.error("Erro ao renderizar item:", erroItem);
            }
            
        });
        setTimeout(() => {
            ativarGerenciadorDeMemoriaAR();
        }, 150);
    } catch (erro) {
        console.error("Erro na conexão com o servidor:", erro);
    }
}

carregarCardapio();
function ativarGerenciadorDeMemoriaAR() {
    customElements.whenDefined('model-viewer').then(() => {
        const MV = customElements.get('model-viewer');
        if (MV) MV.modelCacheSize = 0;
    });

    const MAX_MODELOS_ATIVOS = 2; // teste 1 no celular se ainda pesar
    let modelosAtivos = [];
    let viewerEmAR = null; // enquanto != null, ninguém é carregado/descarregado

    function carregar(mv) {
        if (modelosAtivos.includes(mv)) return;
        const glb = mv.dataset.srcReal;
        const usdz = mv.dataset.iosSrcReal;
        if (!glb) return;

        // Abre vaga descarregando o mais antigo
        while (modelosAtivos.length >= MAX_MODELOS_ATIVOS) {
            descarregar(modelosAtivos[0]);
        }

        mv.setAttribute('src', glb);
        if (usdz) mv.setAttribute('ios-src', `${usdz}#allowsContentScaling=0`);
        modelosAtivos.push(mv);
    }

    function descarregar(mv) {
        modelosAtivos = modelosAtivos.filter(m => m !== mv);
        mv.removeAttribute('src');
        mv.removeAttribute('ios-src');
    }

    const observador = new IntersectionObserver((entradas) => {
        if (viewerEmAR) return; // congelado durante o AR
        entradas.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) carregar(target);
            else descarregar(target);
        });
    }, { rootMargin: '150px 0px', threshold: 0 });

    function ressincronizar() {
        // unobserve + observe força o observer a reavaliar o estado atual
        document.querySelectorAll('model-viewer').forEach(mv => {
            observador.unobserve(mv);
            observador.observe(mv);
        });
    }

    document.querySelectorAll('model-viewer').forEach(mv => {
        // Trava já no clique, antes do evento do model-viewer chegar
        mv.querySelector('.btn-ar')?.addEventListener('click', () => {
            viewerEmAR = mv;
        }, true);

        mv.addEventListener('ar-status', (e) => {
            const status = e.detail.status;
            console.log('[AR]', status); // útil para depurar no chrome://inspect

            if (status === 'session-started') {
                viewerEmAR = mv;
            } else if (status === 'not-presenting' || status === 'failed') {
                if (viewerEmAR === mv) {
                    viewerEmAR = null;
                    ressincronizar();
                }
            }
        });

        observador.observe(mv);
    });
}

