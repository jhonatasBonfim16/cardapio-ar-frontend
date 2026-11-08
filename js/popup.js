document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("modal-aviso-ar");
    const btnFechar = document.getElementById("btn-fechar-modal");

    // Verifica se o usuário já viu o aviso antes
    const jaViuAviso = localStorage.getItem("cardapio_ar_visitado");

    if (!jaViuAviso) {
        // Pequeno atraso para abrir de forma elegante após a página carregar
        setTimeout(() => {
            modal.classList.add("ativo");
        }, 1000);
    }

    // Ação ao clicar no botão
    btnFechar.addEventListener("click", () => {
        modal.classList.remove("ativo");
        // Salva no navegador para não exibir novamente
        localStorage.setItem("cardapio_ar_visitado", "true");
    });
});