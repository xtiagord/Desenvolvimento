$(document).ready(function() {
    function loadRepresentantes() {
        $.ajax({
            url: '/api/representantes',
            method: 'GET',
            success: function(data) {
                const representanteSelect = $('#representante_select');
                representanteSelect.empty(); // Clear existing options
                representanteSelect.append('<option value="" disabled selected>Escolha um representante</option>');
                console.log('Representantes recebidos:', data); // Debug logging
                data.forEach(representante => {
                    representanteSelect.append(`<option value="${representante.id}">${representante.nome}</option>`);
                });
            },
            error: function(xhr, status, error) {
                console.error('Erro ao carregar representantes:', error);
            }
        });
    }

    $('#myModal').on('show.bs.modal', function() {
        console.log("Modal is being shown.");
        loadRepresentantes();
    });
});

// Supondo que você tenha o nível de acesso do usuário disponível na sessão
const user = JSON.parse(sessionStorage.getItem('user')); // Ou qualquer outra forma que você esteja utilizando

// Função para atualizar o menu de navegação com base no nível de acesso
function updateNavigation() {
    const financeLink = document.getElementById('financeLink');

    // Verifica se o usuário existe e obtém o nível de acesso
    if (user) {
        const accessLevel = user.access_level;

        // Se o nível de acesso for 'finance', mantém apenas o link do financeiro
        if (accessLevel === 'finance') {
            // Limpa todos os links, removendo completamente
            document.querySelector('#navLinks').innerHTML = '';
            const financeiroLink = document.createElement('li');
            financeiroLink.className = 'nav-item';
            financeiroLink.innerHTML = '<a class="nav-link active" href="/public/Financeiro.html">Financeiro</a>';
            document.querySelector('#navLinks').appendChild(financeiroLink);
        }
        // Se o nível de acesso não for 'finance', esconde o link de financeiro
        else if (accessLevel !== 'admin') { // Se o usuário não for admin, oculta o link financeiro
            financeLink.style.display = 'none'; // Torna invisível o link financeiro
        }
        // Se o nível de acesso for 'admin', mantém todos os links
    } else {
        // Se não houver usuário, pode esconder ou redirecionar
        document.querySelector('#navLinks').innerHTML = ''; // Pode limpar ou mostrar links de login, etc.
    }
}

// Chama a função para atualizar a navegação
updateNavigation();



let isSidebarOpen = false;

function toggleSidebar() {
    const sidebar = document.getElementById("mySidebar");
    const triggerArea = document.querySelector(".trigger-area");
    const toggleIcon = document.getElementById("toggleIcon");

    if (isSidebarOpen) {
        sidebar.style.width = "0";
        triggerArea.classList.remove("sidebar-open");
        // Mudar o ícone de volta para a seta apontando para a direita
        toggleIcon.classList.remove("fa-chevron-left");
        toggleIcon.classList.add("fa-chevron-right");
    } else {
        sidebar.style.width = "250px";
        triggerArea.classList.add("sidebar-open");
        // Mudar o ícone para a seta apontando para a esquerda
        toggleIcon.classList.remove("fa-chevron-right");
        toggleIcon.classList.add("fa-chevron-left");
    }

    isSidebarOpen = !isSidebarOpen; // Inverte o estado de abertura
}

function openModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "block"; // Mostrar o modal
}

function closeModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "none"; // Ocultar o modal
}

// Fechar o modal se o usuário clicar fora da área do conteúdo
window.onclick = function(event) {
    const modal = document.getElementById("myModal");
    if (event.target === modal) {
        closeModal();
    }
};

$('#myModal').on('show.bs.modal', function() {
    console.log("Modal aberto, carregando representantes...");
    loadRepresentantes();
});

$('#formCadastroComprador').on('submit', function(event) {
    event.preventDefault(); // Impede o envio do formulário para teste
    // Aqui você pode adicionar o código para processar o formulário
});
