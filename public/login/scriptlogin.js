document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    fetch('/index', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password })
    })
    .then(response => {
        if (response.status === 401) {
            document.getElementById('error').textContent = 'Login não autorizado';
        } else if (response.status === 200) {
            return response.json();
        }
    })
    .then(data => {
        if (data.success) {
            // Redirecionar para outra página em caso de sucesso
            window.location.href = '/dashboard.html';
        }
    })
    .catch(error => {
        console.error('Erro ao enviar dados de login:', error);
    });
});


