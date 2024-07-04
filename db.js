const mysql = require('mysql2');

// Configurações da conexão
const connection = mysql.createConnection({
  host: '127.0.0.1:3312',     // Endereço do servidor MySQL
  user: 'valmarc',   // Usuário do banco de dados
  password: '1234', // Senha do banco de dados
  database: 'valmarc_dados' // Nome do banco de dados
});

// Conectar ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão ao banco de dados MySQL estabelecida!');
});

module.exports = connection;
