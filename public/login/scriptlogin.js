document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Previne o envio padrão do formulário

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Enviar dados de login para o servidor
    fetch('https://desenvolvimento-mocha.vercel.app/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password })
    })
    .then(response => {
        if (response.status === 401) {
            document.getElementById('error').textContent = 'Login não autorizado';
            return; // Interromper a execução se o login não for autorizado
        } else if (response.ok) { // Verifica se a resposta foi bem-sucedida
            return response.json(); // Retorna a resposta em formato JSON
        } else {
            throw new Error('Erro no login: ' + response.status); // Lida com outros erros de status
        }
    })
    .then(data => {
        if (data && data.success) { // Verificar se a resposta é válida
            // Armazenar o usuário no sessionStorage para uso futuro
            sessionStorage.setItem('user', JSON.stringify(data)); // Salvar dados do usuário

            // Redirecionar com base no nível de acesso
            const accessLevel = data.access_level; 
            if (accessLevel === 'finance') {
                window.location.href = '/public/Financeiro.html'; // Redirecionar para a tela financeira
            } else {
                window.location.href = '/dashboard.html'; // Redirecionar para o dashboard
            }
        }
    })
    .catch(error => {
        console.error('Erro ao enviar dados de login:', error); // Exibir erro no console
        document.getElementById('error').textContent = 'Erro ao processar login. Tente novamente.'; // Mensagem de erro
    });
});
