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