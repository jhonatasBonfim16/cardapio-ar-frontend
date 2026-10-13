let totalItensNoCarrinho = 0;

function adicionarAoPedido(id, nomePrato) {
    totalItensNoCarrinho++;
    const badge = document.getElementById('contador-carrinho');
    if (badge) {
        badge.innerText = totalItensNoCarrinho;
        if (totalItensNoCarrinho === 1) {
            badge.classList.add('visivel');
        }
        badge.classList.add('pulso');
        setTimeout(() => {
            badge.classList.remove('pulso');
        }, 200);
    }
    alert(`🛒 ${nomePrato} adicionado ao pedido!`);
}

async function carregarCardapio() {
    try {
        const MEU_IP_LOCAL = "192.168.100.77"; 
        // 1. COLE AQUI O LINK REAL QUE O RENDER TE DEU NO PASSO ANTERIOR:
        const API_PRODUCAO = "https://onrender.com"; 

        // Se o site rodar no seu PC, busca no localhost. Se rodar na internet, busca no Render.
        const apiHost = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3000'
            : API_PRODUCAO;

        const resposta = await fetch(`${apiHost}/api/cardapio`);
        const pratos = await resposta.json();

        const container = document.getElementById('lista-cardapio');
        container.innerHTML = ''; 

        pratos.forEach(prato => {
            // Coleta os links completos de internet vindos direto do seu PostgreSQL
            const urlModelo = prato.modelo3d;
            const urlFoto = prato.foto;

            // Injeta a estrutura de cards aplicando o template string correto com o caractere "\$"
            container.innerHTML += `
                <div class="card">
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
                            alt="Modelo 3D de ${prato.nome}">
                            
                            <!-- Botão Customizado com link XMLNS corrigido do padrão SVG -->
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
                                <h2>${prato.nome}</h2>
                                <p>${prato.descricao}</p>
                            </div>
                            <span class="preco">${prato.preco}</span>
                        </div>
                        
                        <button class="btn-adicionar" onclick="adicionarAoPedido(${prato.id}, '${prato.nome}')">
                            Adicionar ao Pedido
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (erro) {
        console.error("Erro na conexão com o servidor:", erro);
    }
}

// Inicializa automaticamente ao abrir a tela
carregarCardapio();
