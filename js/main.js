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
    if (carrinho.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }

    // 1. CAPTURA E HIGIENIZAÇÃO CRÍTICA DO INPUT DO USUÁRIO
    const inputBruto = document.getElementById('input-identificador').value;
    const inputVal = higienizarEntrada(inputBruto);

    if (!inputVal) {
        alert("Por favor, preencha o campo de identificação/endereço obrigatório com caracteres válidos.");
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

        const numeroWhats = "5527998399687";  // alterar depois
        // O encodeURIComponent continua aqui para garantir que a URL do WhatsApp formate os espaços corretamente
        window.open(`https://wa.me/${numeroWhats}?text=${encodeURIComponent(textoMensagem)}`, '_blank');
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


// ================== ESTADO ==================
let ativo = null;          // card com o 3D ligado agora
let viewerEmAR = null;     // enquanto != null, ninguém liga/desliga
let listaAR = [];          // pratos que têm modelo 3D
const preaquecidos = new Set();
const cachePratos = {};    // resposta da API por categoria (chave '' = todas)
let reqId = 0;             // descarta respostas antigas se trocar de categoria rápido

// ================== ATIVAR / DESATIVAR 3D ==================
function ativar(card) {
    if (viewerEmAR || ativo === card) return;
    if (ativo) desativar(ativo);
    const mv = card.querySelector('model-viewer');
    if (card.dataset.usdz) mv.setAttribute('ios-src', card.dataset.usdz);
    mv.setAttribute('src', card.dataset.glb);
    card.classList.add('ativo');
    ativo = card;
}

function desativar(card) {
    const mv = card.querySelector('model-viewer');
    mv.removeAttribute('src');
    mv.removeAttribute('ios-src');
    card.classList.remove('ativo');
    if (ativo === card) ativo = null;
}

// ================== TROCA DE PRATO (compartilhada) ==================
// Aplica um prato da listaAR a um viewer. Usada pelas setas e pela saída do AR.
function mostrarPrato(mv, indice, { aplicarSrc = true } = {}) {
    const p = listaAR[indice];
    if (!p) return;

    mv.dataset.indiceAr = indice;

    const nomeEl = mv.closest('.card')?.querySelector('.ar-nome');
    if (nomeEl) nomeEl.textContent = p.nome;

    if (!aplicarSrc) return; // só atualiza índice e nome

    if (p.usdz) mv.setAttribute('ios-src', p.usdz);
    else mv.removeAttribute('ios-src');
    mv.setAttribute('src', p.glb);
}

// Baixa o GLB uma única vez via preload (prioridade baixa, para não
// competir com o modelo do card que o usuário está vendo).
// Se o model-viewer pedir a mesma URL durante o download, o navegador reaproveita.
function preaquecer(url) {
    if (!url || preaquecidos.has(url)) return;
    preaquecidos.add(url);

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    link.fetchPriority = 'low';
    link.href = url;

    // se falhar, remove a tag e libera a URL para tentar de novo depois
    link.onerror = () => {
        link.remove();
        preaquecidos.delete(url);
    };

    document.head.appendChild(link);
}

// ================== OBSERVADORES ==================
// Liga o 3D do card que cruza a faixa central da tela
const observadorAtivo = new IntersectionObserver((entradas) => {
    if (viewerEmAR) return;
    entradas.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) ativar(target);
        else if (ativo === target) desativar(target);
    });
}, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

// Pré-aquece os cards que estão chegando perto
const observadorPreload = new IntersectionObserver((entradas) => {
    entradas.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) preaquecer(target.dataset.glb);
    });
}, { rootMargin: '600px 0px', threshold: 0 });

// ================== EVENTO ar-status (registrado UMA vez) ==================
document.addEventListener('ar-status', (e) => {
    const mv = e.target;
    if (!mv || mv.tagName !== 'MODEL-VIEWER') return;
    const status = e.detail.status;

    if (status === 'session-started') {
        viewerEmAR = mv;
    } else if (status === 'not-presenting' || status === 'failed') {
        if (viewerEmAR === mv) viewerEmAR = null;

        // ao sair do AR, volta ao prato original do card
        const i = Number(mv.dataset.indiceOriginal);
        if (listaAR[i] && mv.dataset.indiceAr !== String(i)) {
            const card = mv.closest('.card');
            // só recarrega o modelo se esse card for o que está ligado;
            // se não for, o ativar() já usa o GLB original do dataset
            mostrarPrato(mv, i, { aplicarSrc: card === ativo });
        }
    }
}, true);

// ================== CARREGAR CARDÁPIO ==================
async function carregarCardapio() {
    const meu = ++reqId;
    try {
        const chave = categoriaAtual || '';
        let pratos = cachePratos[chave];

        // só vai à API na primeira vez que a categoria é aberta
        if (!pratos) {
            const url = categoriaAtual
                ? `${API_PRODUCAO}/api/cardapio?categoria=${encodeURIComponent(categoriaAtual)}`
                : `${API_PRODUCAO}/api/cardapio`;

            const resposta = await (await fetch(url)).json();
            if (meu !== reqId) return; // o usuário já trocou de categoria
            if (!Array.isArray(resposta)) return console.error('Resposta inválida da API');

            cachePratos[chave] = resposta;
            pratos = resposta;
        }

        // Lista usada pelas setas dentro do AR
        listaAR = pratos
            .map(p => ({
                nome: p.nome || 'Prato sem nome',
                glb: p.modelo_3d_url || p.modelo3d || '',
                usdz: p.modelo3d_ios ? `${p.modelo3d_ios}#allowsContentScaling=0` : ''
            }))
            .filter(p => p.glb);

        // Limpa o estado anterior (útil ao trocar de categoria)
        observadorAtivo.disconnect();
        observadorPreload.disconnect();
        ativo = null;

        const container = document.getElementById('lista-cardapio');
        container.innerHTML = '';

        pratos.forEach((prato, i) => {
            const id = prato.id ?? i;
            const nome = prato.nome || 'Prato sem nome';
            const precoNum = parseFloat(prato.preco);
            const preco = !isNaN(precoNum) ? precoNum.toFixed(2).replace('.', ',') : '0,00';

            const card = document.createElement('div');
            card.className = 'card';
            card.dataset.glb = prato.modelo_3d_url || prato.modelo3d || '';
            card.dataset.usdz = prato.modelo3d_ios
                ? `${prato.modelo3d_ios}#allowsContentScaling=0` : '';

            card.innerHTML = `
        <div class="viewport-ar">
          <img class="foto" loading="lazy" alt="">
          <model-viewer
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-placement="floor"
            camera-controls
            interaction-prompt="none"
            ar-scale="fixed"
            touch-action="pan-y"
            shadow-intensity="1"
            exposure="1.2"
            loading="lazy"> 
            <button slot="ar-button" class="btn-ar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18a2.25 2.25 0 01-2.25 2.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg> Ver em 3D
            </button>

            <div class="ar-ui">
              <div class="ar-titulo"><span class="ar-nome"></span></div>
              <button class="ar-seta ar-esq" aria-label="Prato anterior">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button class="ar-seta ar-dir" aria-label="Próximo prato">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </model-viewer>
        </div>
        <div class="card-detalhes">
          <div class="card-header">
            <div><h2></h2><p></p></div>
            <span class="preco">R$ ${preco}</span>
          </div>
          <button class="btn-adicionar">Adicionar ao Pedido</button>
        </div>`;

            // textContent evita problemas de aspas/HTML
            const img = card.querySelector('.foto');
            img.src = prato.imagem_url || prato.foto || '';
            img.alt = nome;

            const mv = card.querySelector('model-viewer');
            mv.setAttribute('alt', `Modelo 3D de ${nome}`);
            card.querySelector('h2').textContent = nome;
            card.querySelector('p').textContent = prato.descricao || 'Sem descrição cadastrada.';
            card.querySelector('.ar-nome').textContent = nome;
            card.querySelector('.btn-adicionar')
                .addEventListener('click', () => adicionarAoPedido(id, nome, precoNum));

            // Índice deste prato dentro da listaAR
            const indiceInicial = listaAR.findIndex(p => p.glb === card.dataset.glb);
            mv.dataset.indiceAr = indiceInicial;
            mv.dataset.indiceOriginal = indiceInicial;

            // Troca de prato dentro do AR
            function trocarAR(delta) {
                const n = listaAR.length;
                if (n < 2) return;

                const atual = Number(mv.dataset.indiceAr);
                const novo = ((atual < 0 ? 0 : atual) + delta + n) % n;

                mostrarPrato(mv, novo);

                // pré-aquece o próximo e o anterior
                preaquecer(listaAR[(novo + 1) % n].glb);
                preaquecer(listaAR[(novo - 1 + n) % n].glb);
            }

            // Impede que o toque nas setas também posicione o objeto no AR
            card.querySelectorAll('.ar-seta').forEach(btn => {
                btn.addEventListener('beforexrselect', e => e.preventDefault());
            });
            card.querySelector('.ar-esq').addEventListener('click', () => trocarAR(-1));
            card.querySelector('.ar-dir').addEventListener('click', () => trocarAR(1));

            container.appendChild(card);

            if (card.dataset.glb) {
                observadorAtivo.observe(card);
                observadorPreload.observe(card);
            } else {
                // prato sem modelo 3D: fica só com a foto, sem botão de AR
                mv.removeAttribute('ar');
                card.querySelector('.btn-ar').hidden = true;
                card.querySelector('.ar-ui').hidden = true;
            }
        });

        // Opcional: Pré-aquece automaticamente os 2 primeiros itens logo que o cardápio abre
        if (listaAR.length > 0) preaquecer(listaAR[0].glb);
        if (listaAR.length > 1) preaquecer(listaAR[1].glb);

    } catch (e) {
        console.error('Erro na conexão com o servidor:', e);
    }
}

// ================== ALTERNAR CATEGORIA ==================
function alternarCategoria(elemento, categoria) {
    // Altera a classe visual ativa no menu horizontal
    document.querySelectorAll('.categoria-item').forEach(aba => aba.classList.remove('ativo'));
    elemento.classList.add('ativo');

    categoriaAtual = categoria;
    carregarCardapio(); // usa o cache e só vai à API na 1ª vez de cada categoria
}

carregarCardapio();

/*
async function diagnosticoAR() {
    const info = [];
    info.push('secureContext: ' + window.isSecureContext);
    info.push('navigator.xr: ' + !!navigator.xr);
    if (navigator.xr) {
        try {
            info.push('immersive-ar: ' + await navigator.xr.isSessionSupported('immersive-ar'));
        } catch (e) { info.push('erro: ' + e.message); }
    }
    info.push('UA: ' + navigator.userAgent);
    const el = document.createElement('pre');
    el.style.cssText = 'position:fixed;bottom:0;left:0;right:0;background:#000;color:#0f0;font-size:11px;z-index:9999;margin:0;padding:6px;white-space:pre-wrap';
    el.textContent = info.join('\n');
    document.body.appendChild(el);
}
diagnosticoAR();
*/