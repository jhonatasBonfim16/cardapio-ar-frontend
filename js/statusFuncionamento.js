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