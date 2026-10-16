// Array em memória para salvar os itens e dados da sacola de compras
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
    alert(`🛒 ${nomePrato} adicionado à sua sacola!`);
}

function atualizarBadgeCarrinho() {
    // CORREÇÃO CRÍTICA AQUI: Removido o 'sCategory' que quebrava o interpretador JS
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    const badge = document.getElementById('contador-carrinho');

    if (badge) {
        badge.innerText = totalItens;
        if (totalItens > 0) {
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

    let valorTotalGeral = 0;

    carrinho.forEach(item => {
        const subtotal = item.preco * item.quantidade;
        valorTotalGeral += subtotal;

        container.innerHTML += `
            <div class="item-carrinho-linha">
                <div>
                    <h4>${item.nome}</h4>
                    <small>R$ ${item.preco.toFixed(2).replace('.', ',')} x ${item.quantidade}</small>
                </div>
                <strong>R$ ${subtotal.toFixed(2).replace('.', ',')}</strong>
            </div>
        `;
    });

    totalTxt.innerText = `R$ ${valorTotalGeral.toFixed(2).replace('.', ',')}`;
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

// Envio Inteligente do Pedido Final
function enviarPedidoFinal() {
    if (carrinho.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }

    const inputVal = document.getElementById('input-identificador').value.trim();
    if (!inputVal) {
        alert("Por favor, preencha o campo de identificação/endereço obrigatório.");
        return;
    }

    const tipoPedido = document.querySelector('input[name="tipo-pedido"]:checked').value;

    // Monta o corpo da mensagem de texto limpa
    let textoMensagem = `*NOVO PEDIDO - BISTRO AR*\n\n`;
    carrinho.forEach(item => {
        textoMensagem += `• ${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}\n`;
    });

    const totalGeral = carrinho.reduce((soma, item) => soma + (item.preco * item.quantidade), 0);
    textoMensagem += `\n*Total Geral:* R$ ${totalGeral.toFixed(2).replace('.', ',')}\n`;

    if (tipoPedido === 'mesa') {
        textoMensagem += `📍 *Consumo local na Mesa:* ${inputVal}`;
        alert("🚀 Pedido enviado com sucesso para a cozinha da nossa mesa!");
    } else {
        textoMensagem += `🛵 *Entrega no Endereço:* ${inputVal}`;
        // CORREÇÃO CRÍTICA AQUI: Corrigida a montagem do link da API oficial do WhatsApp
        const numeroWhats = "5527998399687";
        window.open(`https://wa.me/${numeroWhats}?text=${encodeURIComponent(textoMensagem)}`, '_blank');

    }

    // Limpa o carrinho após finalizar
    carrinho = [];
    atualizarBadgeCarrinho();
    fecharCarrinho();
}

// LÓGICA DE FILTRAGEM REATIVA POR CATEGORIAS
function alternarCategoria(elemento, categoria) {
    // Altera a classe visual ativa no menu horizontal
    document.querySelectorAll('.categoria-item').forEach(aba => aba.classList.remove('ativo'));
    elemento.classList.add('ativo');

    categoriaAtual = categoria;
    console.log(categoria)
    carregarCardapio(); // Re-chama o fetch aplicando a rota filtrada no Postgres
}

async function carregarCardapio() {
    try {
        const API_PRODUCAO = "https://cardapio-ar-backend.onrender.com";
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
                const urlFoto = prato.imagem_url || prato.foto || '';
                const nomeEscapado = nome.replace(/'/g, "\\'");

                const cardDiv = document.createElement('div');
                cardDiv.className = 'card';

                // CORREÇÃO AQUI: Ajustado o xmlns do SVG para o link correto da W3C
                cardDiv.innerHTML = `
                    <div class="viewport-ar">
                        <model-viewer 
                            src="${urlModelo}" 
                            poster="${urlFoto}"
                            ar 
                            ar-modes="webxr scene-viewer quick-look" 
                            camera-controls 
                            touch-action="pan-y"
                            shadow-intensity="1"
                            exposure="1.2"
                            alt="Modelo 3D de ${nome}">
                            
                            <button slot="ar-button" class="btn-ar">
                                <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
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
    } catch (erro) {
        console.error("Erro na conexão com o servidor:", erro);
    }
}

carregarCardapio();
