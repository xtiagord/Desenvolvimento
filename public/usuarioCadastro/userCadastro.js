document.getElementById('userForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const accessLevel = document.getElementById('access_level').value;

    fetch('/cadastrarUsuario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: username, password: password, access_level: accessLevel })
    })
    .then(response => response.json())
    .then(data => {
        const messageElement = document.getElementById('message');
        if (data.success) {
            messageElement.textContent = 'Usuário cadastrado com sucesso!';
            messageElement.className = 'text-success';
        } else {
            messageElement.textContent = 'Erro ao cadastrar usuário: ' + data.message;
            messageElement.className = 'text-danger';
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        document.getElementById('message').textContent = 'Erro ao cadastrar usuário';
        document.getElementById('message').className = 'text-danger';
    });
});