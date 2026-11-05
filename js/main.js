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


// LÓGICA DE FILTRAGEM REATIVA POR CATEGORIAS
function alternarCategoria(elemento, categoria) {
    // Altera a classe visual ativa no menu horizontal
    document.querySelectorAll('.categoria-item').forEach(aba => aba.classList.remove('ativo'));
    elemento.classList.add('ativo');

    categoriaAtual = categoria;
    carregarCardapio(); // Re-chama o fetch aplicando a rota filtrada no Postgres
}

let ativo = null;          // card com o 3D ligado agora
let viewerEmAR = null;     // enquanto != null, ninguém liga/desliga
const preaquecidos = new Set();

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

// Baixa o GLB uma vez para o cache HTTP do navegador
function preaquecer(url) {
  if (!url || preaquecidos.has(url)) return;
  preaquecidos.add(url);
  fetch(url, { cache: 'force-cache' }).catch(() => preaquecidos.delete(url));
}

// 1) Liga o 3D do card que cruza a faixa central da tela
const observadorAtivo = new IntersectionObserver((entradas) => {
  if (viewerEmAR) return;
  entradas.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) ativar(target);
    else if (ativo === target) desativar(target);
  });
}, { rootMargin: '-35% 0px -35% 0px', threshold: 0 });

// 2) Pré-aquece os cards que estão chegando perto
const observadorPreload = new IntersectionObserver((entradas) => {
  entradas.forEach(({ target, isIntersecting }) => {
    if (isIntersecting) preaquecer(target.dataset.glb);
  });
}, { rootMargin: '600px 0px', threshold: 0 });

async function carregarCardapio() {
  try {
    const url = categoriaAtual
      ? `${API_PRODUCAO}/api/cardapio?categoria=${encodeURIComponent(categoriaAtual)}`
      : `${API_PRODUCAO}/api/cardapio`;

    const pratos = await (await fetch(url)).json();
    if (!Array.isArray(pratos)) return console.error('Resposta inválida da API');

    const container = document.getElementById('lista-cardapio');
    container.innerHTML = '';
    if (ativo) ativo = null;

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
            touch-action="pan-y"
            shadow-intensity="1"
            exposure="1.2">
            <button slot="ar-button" class="btn-ar">Ver em 3D</button>
          </model-viewer>
        </div>
        <div class="card-detalhes">
          <div class="card-header">
            <div><h2></h2><p></p></div>
            <span class="preco">R$ ${preco}</span>
          </div>
          <button class="btn-adicionar">Adicionar ao Pedido</button>
        </div>`;

      const img = card.querySelector('.foto');
      img.src = prato.imagem_url || prato.foto || '';
      img.alt = nome;
      card.querySelector('model-viewer').setAttribute('alt', `Modelo 3D de ${nome}`);
      card.querySelector('h2').textContent = nome;
      card.querySelector('p').textContent = prato.descricao || 'Sem descrição cadastrada.';
      card.querySelector('.btn-adicionar')
          .addEventListener('click', () => adicionarAoPedido(id, nome, precoNum));

      container.appendChild(card);
      observadorAtivo.observe(card);
      observadorPreload.observe(card);
    });

    // Congela a troca de modelos enquanto a sessão de AR estiver aberta
    // (captura, porque o evento ar-status não sobe pelo DOM)
    container.addEventListener('ar-status', (e) => {
      const status = e.detail.status;
      if (status === 'session-started') {
        viewerEmAR = e.target;
      } else if (status === 'not-presenting' || status === 'failed') {
        viewerEmAR = null;
      }
    }, true);
  } catch (e) {
    console.error('Erro na conexão com o servidor:', e);
  }
}
carregarCardapio();

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