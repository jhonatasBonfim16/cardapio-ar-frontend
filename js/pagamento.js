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
