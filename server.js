const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');



// Inicializar o Express
const app = express();
const PORT = process.env.PORT || 3001;

// Criação da conexão
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'sys_test'
});

// Conectar ao banco de dados
db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados.');
});



// Configurar o middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Método para consultas usando callbacks
const query = (sql, values, callback) => {
    pool.query(sql, values, (err, results) => {
        if (err) {
            return callback(err);
        }
        callback(null, results);
    });
};

const storage = multer.memoryStorage();
const upload = multer({ storage });
const extractUpload = multer().single('pdf');
//const upload = multer({ dest: 'uploads/' }).fields([{ name: 'file', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]);


// Função para atualizar as informações das pastas
const foldersInfoFile = path.join(__dirname, 'foldersInfo.json');

const updateFoldersInfo = (folderPath) => {
    let foldersInfo = [];

    // Ler dados existentes
    if (fs.existsSync(foldersInfoFile)) {
        const data = fs.readFileSync(foldersInfoFile);
        foldersInfo = JSON.parse(data);
    }

    // Adicionar nova informação da pasta
    const newFolderInfo = {
        path: folderPath,
        createdAt: new Date().toISOString(),
    };

    foldersInfo.push(newFolderInfo);

    // Manter apenas as últimas 10 entradas
    if (foldersInfo.length > 10) {
        foldersInfo = foldersInfo.slice(-10);
    }

    // Escrever dados atualizados de volta para o arquivo
    fs.writeFileSync(foldersInfoFile, JSON.stringify(foldersInfo, null, 2));
};

// Função para extrair dados do PDF
function extractPDFData(text) {
    const tableRegex = /(\d,\d+)\s*(\d+,\d+)\s*(\d+,\d+)\s*(\d,\d{4})\s*(\d+,\d+)\s*(\d+,\d+)/gm;
    const dataRegex = /Data\/Hora:\s+(\d{2}\/\d{2}\/\d{4})/;
    const horaRegex = /\b\d{2}:\d{2}\b/i;
    const representanteRegex = /Apelido\s+([A-Za-z]+)\s+[A-Za-z]+/;
    const fornecedorRegex = /(?:\n|^)([A-Za-z]+\s+[A-Za-z]+(?:\s+[A-Za-z]+)*)\s*Comprador/;
    const snRegex = /SN-\d+/;

    const tableData = [];
    let match;

    while ((match = tableRegex.exec(text)) !== null) {
        const data = {
            kg: match[1],
            pd: match[2],
            pt: match[3],
            rh: match[4],
            valorKg: match[5],
            valor: match[6]
        };

        
        const dataMatch = dataRegex.exec(text);
        if (dataMatch) {
            console.log("Data encontrada:", dataMatch[1]);
            data.data = dataMatch[1];
        } else {
            console.log("Data não encontrada");
        }

        const horaMatch = horaRegex.exec(text);
        if (horaMatch) {
            console.log("Hora encontrada:", horaMatch[1]);
            data.hora = horaMatch[0];
        } else {
            console.log("Hora não encontrada");
        }

        const representanteMatch = representanteRegex.exec(text);
        if (representanteMatch) {
            console.log("Representante encontrado:", representanteMatch[1]);
            data.representante = representanteMatch[1];
        } else {
            console.log("Representante não encontrado");
        }

        const fornecedorMatch = fornecedorRegex.exec(text);
        if (fornecedorMatch) {
            console.log("Fornecedor encontrado:", fornecedorMatch[1]);
            data.fornecedor = fornecedorMatch[1];
        } else {
            console.log("Fornecedor não encontrado");
        }

        const snRegexMatch = snRegex.exec(text);
        if(snRegexMatch){
            console.log("SN encontrado:", snRegex[0]);
            data.sn = snRegexMatch[0];
        } else {
            console.log("SN não encontrado");
        }
        tableData.push(data);
    }

    console.log(tableData);

    return tableData;
}

// Endpoint para extração de PDF
app.post('/extract', extractUpload, async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        const data = await pdfParse(req.file.buffer);

        console.log("Texto extraído do PDF:", data.text);
        
        const extractedData = extractPDFData(data.text);
        res.json(extractedData);
    } catch (error) {
        console.error("Erro ao processar o PDF:", error); // Log do erro
        res.status(500).send('Error processing PDF');
    }
});

app.post('/save', (req, res) => {
    const data = req.body;
    console.log('Dados recebidos:', data);

    if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ message: 'Dados inválidos ou ausentes' });
    }

    const insertQuery = 'INSERT INTO dados (Npdf, kg, pd, pt, rh, valorKg, valor, data, hora, representante, fornecedor, sn, lote) VALUES ?';
    const values = data.map(row => [row.Npdf, row.kg, row.pd, row.pt, row.rh, row.valorKg, row.valor, row.data, row.hora, row.representante, row.fornecedor, row.sn, row.lote]);

    db.query(insertQuery, [values], (err, result) => {
        if (err) {
            console.error('Erro ao inserir dados:', err);
            return res.status(500).json({ message: 'Erro ao inserir dados', error: err });
        }
        console.log('Resultado da inserção:', result);
        res.status(200).json({ message: 'Dados inseridos com sucesso' });
    });
});

//rota representante e cooperados -extrator.html
app.get('/representantes', (req, res) => {
    db.query('SELECT id, nome FROM representantes', (err, results) => {
      if (err) {
        console.error('Erro ao buscar representantes:', err);
        return res.status(500).json({ message: 'Erro ao buscar representantes', error: err });
      }
      res.json(results);
    });
  });
  app.post('/api/representantes', (req, res) => {
    const { nome, maquina } = req.body;

    if (!nome || !maquina) {
        return res.status(400).send('Nome e Máquina são obrigatórios');
    }

    // Primeiro, insira o representante na tabela representantes
    const insertRepresentanteQuery = 'INSERT INTO representantes (nome) VALUES (?)';
    db.query(insertRepresentanteQuery, [nome], (err, result) => {
        if (err) {
            console.error('Erro ao inserir representante:', err);
            return res.status(500).send('Erro ao cadastrar representante');
        }

        // Em seguida, associe o representante com a máquina na tabela representante_equipamentos
        const representanteId = result.insertId;
        const insertRelacionamentoQuery = 'INSERT INTO representante_equipamentos (id_representante, id_equipamento) VALUES (?, ?)';
        db.query(insertRelacionamentoQuery, [representanteId, maquina], (err, result) => {
            if (err) {
                console.error('Erro ao associar representante com máquina:', err);
                return res.status(500).send('Erro ao associar representante com máquina');
            }
            res.status(200).send('Representante cadastrado e associado com máquina com sucesso');
        });
    });
});
app.get('/api/representantes/:id', (req, res) => {
    const idRepresentante = req.params.id;
    console.log('Recebendo solicitação para representante com ID:', idRepresentante); // Log para verificar a solicitação

    const query = 'SELECT * FROM representantes WHERE id = ?';
    db.query(query, [idRepresentante], (err, results) => {
        if (err) {
            console.error('Erro ao buscar representante:', err);
            res.status(500).send('Erro no servidor');
            return;
        }
        if (results.length === 0) {
            res.status(404).send('Representante não encontrado');
            return;
        }
        console.log('Resultados da consulta:', results); // Log para verificar os resultados da consulta
        res.json(results[0]);
    });
});


  // Rota para obter fornecedores
  app.get('/fornecedores', (req, res) => {
    db.query('SELECT id, nome FROM cooperados', (err, results) => {
      if (err) {
        console.error('Erro ao buscar fornecedores:', err);
        return res.status(500).json({ message: 'Erro ao buscar fornecedores', error: err });
      }
      res.json(results);
    });
  });
  

// Rota para criar subpastas e mover arquivos
app.post('/create-subfolder', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(500).send('Error uploading files.');
        }

        const { date, mainFolder, baseFolder, subFolderName, directory, newFileName } = req.body;

        if (!date || !mainFolder || !subFolderName || !directory || !newFileName) {
            return res.status(400).send('Date, main folder, subfolder name, directory, and new file name are required.');
        }

        // Valida e formata a data
        const dateParts = date.split('/');
        if (dateParts.length !== 3) {
            return res.status(400).send('Invalid date format. Please use DD/MM/YYYY.');
        }

        const [day, month, year] = dateParts;
        const formattedDate = `${day}-${month}-${year}`;

        // Cria o caminho da pasta
        const mainFolderPath = path.join(directory, `ENTREGAS ${formattedDate}`);
        const specificFolderPath = mainFolder === '- PARAGUAI' || mainFolder === '- BOLIVIA' ? path.join(mainFolderPath, mainFolder) : mainFolderPath;
        const subFolderPath = mainFolder === 'ENTREGAS' ? path.join(specificFolderPath, subFolderName) : path.join(specificFolderPath, baseFolder, subFolderName);

        // Cria a pasta se não existir
        fs.mkdir(subFolderPath, { recursive: true }, (err) => {
            if (err) {
                return res.status(500).send('Error creating subfolder.');
            }

            // Processa o arquivo e o PDF, se houver
            const handleFile = (fileKey, renameFile) => {
                if (req.files[fileKey]) {
                    const file = req.files[fileKey][0];
                    const tempPath = file.path;
                    const fileExt = path.extname(file.originalname);

                    // Decide o nome do arquivo
                    const targetFileName = renameFile ? newFileName + fileExt : file.originalname;
                    const targetPath = path.join(subFolderPath, targetFileName);

                    return new Promise((resolve, reject) => {
                        fs.copyFile(tempPath, targetPath, (err) => {
                            if (err) return reject(err);

                            fs.unlink(tempPath, (err) => {
                                if (err) return reject(err);
                                resolve();
                            });
                        });
                    });
                }
                return Promise.resolve();
            };

            Promise.all([
                handleFile('file', true),  // Renomeia o arquivo
                handleFile('pdfFile', false) // Não renomeia o PDF
            ])
            .then(() => {
                updateFoldersInfo(subFolderPath);
                res.send('Subfolder and files created successfully.');
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error handling files.');
            });
        });
    });
});

// Endpoint para obter as últimas 10 pastas criadas
app.get('/last-10-folders', (req, res) => {
    if (fs.existsSync(foldersInfoFile)) {
        const data = fs.readFileSync(foldersInfoFile);
        const foldersInfo = JSON.parse(data);
        res.json(foldersInfo);
    } else {
        res.json([]);
    }
});

app.use(session({
    secret: 'seu_segredo_aqui',
    resave: false,
    saveUninitialized: true
}));

app.get('/', (req, res) => {
    console.log("Acessando a rota raiz");
    res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
            console.error("Erro ao enviar index.html:", err);
        } else {
            console.log("index.html enviado com sucesso");
        }
    });
});

// Servir o arquivo Configuração.html
app.get('/public/configuracao.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'configuracao.html'));
});

// Servir o arquivo Cadastro.html
app.get('/public/Cadastro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Cadastro.html'));
});

// Servir o arquivo Extrator.html
app.get('/public/Extrator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Extrator.html'));
});

// Arquivo Cooperados 
app.get('/public/Cliente.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Cliente.html'));
});

//arquivo pasta 
app.get('/public/pasta.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pasta.html'));
});

// Arquivo Dashboard 
app.get('/public/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Arquivo FOTO E PDF
app.get('/public/ArchivePast.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'ArchivePast.html'));
});

app.get('/api/dados', (req, res) => {
    const sql = "SELECT * FROM dados";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar dados:", err);
            return res.status(500).send("Erro ao buscar dados do banco de dados.");
        }

        // Processar e formatar os resultados
        const processedResults = results.map(item => {
            // Converter valores para decimal
            let valor = item.Valor;

            if (valor) {
                // Remover pontos e substituir vírgula por ponto
                valor = parseFloat(valor.replace(/\./g, '').replace(',', '.'));
            }

            return {
                ...item,
                Valor: valor
            };
        });

        res.json(processedResults);
    });
});

app.get('/api/representantes', (req, res) => {
    const sql = 'SELECT * FROM representantes';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar representantes:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.get('/dados/:nomeRepresentante', (req, res) => {
    const nomeRepresentante = req.params.nomeRepresentante.trim();
    console.log('Nome do Representante:', nomeRepresentante); // Adicione este log

    const query = 'SELECT * FROM dados WHERE LOWER(representante) LIKE ?';
    db.query(query, [`%${nomeRepresentante.toLowerCase()}%`], (err, results) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            res.status(500).send('Erro no servidor');
            return;
        }
        console.log('Resultados da consulta', results)
        res.json(results);
    });
});
app.post('/api/cooperados', (req, res) => {
    const { nome, cpf, representanteId } = req.body;

    if (!nome || !cpf || !representanteId) {
        console.error('Dados incompletos:', { nome, cpf, representanteId });
        return res.status(400).json({ error: 'Nome, CPF e Representante são obrigatórios.' });
    }

    const checkCpfSql = "SELECT COUNT(*) AS count FROM cooperados WHERE cpf = ?";
    db.query(checkCpfSql, [cpf], (err, results) => {
        if (err) {
            console.error("Erro ao verificar CPF:", err);
            return res.status(500).json({ error: "Erro ao verificar CPF." });
        }

        if (results[0].count > 0) {
            return res.status(400).json({ error: 'CPF já cadastrado. Por favor, verifique os dados.' });
        } else {
            const checkRepSql = 'SELECT id FROM representantes WHERE id = ?';
            db.query(checkRepSql, [representanteId], (err, results) => {
                if (err) {
                    console.error('Erro ao verificar representante:', err);
                    return res.status(500).json({ error: err.message });
                }
                if (results.length === 0) {
                    console.error('Representante não encontrado:', representanteId);
                    return res.status(400).json({ error: 'Representante não encontrado.'});
                }

                const insertSql = 'INSERT INTO cooperados (nome, cpf, representante_id) VALUES (?, ?, ?)';
                db.query(insertSql, [nome, cpf, representanteId], (err, results) => {
                    if (err) {
                        console.error('Erro ao inserir cooperado:', err);
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ success: true, message: "Cooperado cadastrado com sucesso!" });
                });
            });
        }
    });
});
app.get('/api/cooperados', (req, res) => {
    const { nome, cpf, representante_id } = req.query;
    let query = 'SELECT c.nome, c.cpf, r.nome AS representante FROM cooperados c JOIN representantes r ON c.representante_id = r.id WHERE 1=1';
    let params = [];

    if (nome) {
        query += ' AND LOWER(c.nome) LIKE ?';
        params.push(`%${nome.toLowerCase()}%`);
    }

    if (cpf) {
        query += ' AND LOWER(c.cpf) LIKE ?';
        params.push(`%${cpf.toLowerCase()}%`);
    }

    if (representante_id) {
        query += ' AND c.representante_id = ?';
        params.push(representante_id);
    }

    db.query(query, params, (error, results) => {
        if (error) {
            return res.status(500).json({ error: 'Erro ao buscar cooperados' });
        }
        res.json(results);
    });
});

app.get('/api/cooperados/:representanteId', (req, res) => {
    const representanteId = req.params.representanteId;

    if (!representanteId) {
        return res.status(400).json({ error: 'representanteId é obrigatório' });
    }
  
    const sql = `
      SELECT *
      FROM cooperados
      WHERE representante_id = ?;
    `;
  
    db.query(sql, [representanteId], (error, results) => {
      if (error) {
        console.error('Erro ao buscar cooperados associados:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
        return;
      }
  
      if (results.length === 0) {
          return res.status(404).json({ error: 'Nenhum cooperado encontrado para o representante fornecido' });
      }
  
      res.json(results);
    });
});

app.get('/api/cooperados/check-cpf/:cpf', (req, res) => {
    const cpf = req.params.cpf;
    const sql = "SELECT COUNT(*) AS count FROM cooperados WHERE cpf = ?";
    db.query(sql, [cpf], (err, results) => {
        if (err) {
            console.error("Erro ao verificar CPF:", err);
            return res.status(500).json({ error: "Erro ao verificar CPF." });
        }
        const count = results[0].count;
        res.json({ exists: count > 0 });
    });
});

app.get('/api/cooperados/:id', (req, res) => {
    const cooperadoId = req.params.id;
    const sql = 'SELECT * FROM cooperados WHERE id = ?';

    db.query(sql, [cooperadoId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar cooperado:', err);
            return res.status(500).json({ error: 'Erro ao buscar cooperado' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Cooperado não encontrado' });
        }

        res.json(results[0]);
    });
});

// Rota para excluir um cooperado por ID
app.delete('/api/cooperados/:id', (req, res) => {
    const cooperadoId = parseInt(req.params.id); // Converter para inteiro
    // Verifique se o cooperadoId é um número válido
    if (isNaN(cooperadoId)) {
        return res.status(400).json({ success: false, error: 'ID do cooperado inválido' });
    }
    // Consulta SQL para deletar o cooperado pelo ID
    const sql = 'DELETE FROM cooperados WHERE id = ?';
    db.query(sql, [cooperadoId], (err, result) => {
        if (err) {
            console.error('Erro ao excluir cooperado:', err);
            return res.status(500).json({ success: false, error: 'Erro ao excluir cooperado' });
        }
        // Se a deleção foi bem-sucedida, retorne sucesso
        res.json({ success: true, message: 'Cooperado excluído com sucesso!' });
    });
});

app.delete('/api/representantes/:id', async (req, res) => {
    const representanteId = req.params.id; // Corrigido para representanteId

    try {
        const sql = `
            DELETE FROM representantes
            WHERE id = ?
        `;
        await db.query(sql, [representanteId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao excluir representante:', err);
        res.status(500).json({ error: 'Erro ao excluir representante' });
    }
});

// Rota para editar um cooperado por ID
app.put('/api/cooperados/:id', (req, res) => {
    const cooperadoId = parseInt(req.params.id);
    const { nome, cpf, representanteId } = req.body;

    if (isNaN(cooperadoId)) {
        return res.status(400).json({ success: false, error: 'ID do cooperado inválido' });
    }

    const sql = 'UPDATE cooperados SET nome = ?, cpf = ?, representante_id = ? WHERE id = ?';
    db.query(sql, [nome, cpf, representanteId, cooperadoId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar cooperado:', err);
            return res.status(500).json({ success: false, error: 'Erro ao atualizar cooperado' });
        }

        res.json({ success: true, message: 'Cooperado atualizado com sucesso!' });
    });
});
app.get('/api/representantes/:nome', (req, res) => {
    const nome = req.params.nome;
    const sql = 'SELECT * FROM representantes WHERE nome = ?';
    connection.query(sql, [nome], (err, results) => {
        if (err) {
            console.error('Erro ao buscar representante por nome:', err);
            return res.status(500).json({ error: 'Erro interno ao buscar representante' });
        }
        if (results.length > 0) {
            res.json(results[0]); // Retorna o primeiro representante encontrado
        } else {
            res.status(404).json({ message: 'Representante não encontrado' });
        }
    });
});

app.put('/api/representantes/:id', (req, res) => {
    const idRepresentante = req.params.id;
    const { nome } = req.body;
    const query = 'UPDATE representantes SET nome = ? WHERE id = ?';
    db.query(query, [nome, idRepresentante], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar representante:', err);
            res.status(500).send('Erro no servidor');
            return;
        }
        res.send('Representante atualizado com sucesso');
    });
});
app.get('/api/equipamentos', (req, res) => {
    const sql = 'SELECT * FROM equipamentos';
    db.query(sql, (err, result) => {
        if (err) {
            console.error('Erro ao buscar equipamentos:', err);
            return res.status(500).send('Erro ao buscar equipamentos');
        }
        res.json(result); // Envie os dados como JSON
    });
});
app.post('/api/equipamentos', (req, res) => {
    const { nomeequipamento, porcentagemPd, porcentagemPt, porcentagemRh } = req.body;
    const query = 'INSERT INTO equipamentos (nomeequipamento, porcentagemPd, porcentagemPt, porcentagemRh) VALUES (?, ?, ?, ?)';
  
    db.query(query, [nomeequipamento, porcentagemPd, porcentagemPt, porcentagemRh], (err, result) => {
      if (err) {
        console.error('Erro ao cadastrar equipamento:', err);
        return res.status(500).send(err);
      }
      res.status(200).json({ message: 'Equipamento cadastrado com sucesso!' });
    });
});

app.get('/api/equipamentos/:representanteId', async (req, res) => {
    const representanteId = req.params.representanteId;
  
    try {
      // Consulta no banco de dados para obter equipamentos associados ao representante
      const query = `
        SELECT e.id, e.nome
        FROM equipamentos e
        INNER JOIN representante_equipamento re ON e.id = re.id_equipamento
        WHERE re.id_representante = ?
      `;
      const equipamentos = await pool.query(query, [representanteId]);
  
      res.json(equipamentos);
    } catch (error) {
      console.error('Erro ao consultar equipamentos:', error);
      res.status(500).json({ error: 'Erro ao consultar equipamentos' });
    }
  });
  app.get('/api/exportarRepresentantes', (req, res) => {
    const query = 'SELECT * FROM dados';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar representantes:', err);
            res.status(500).json({ error: 'Erro ao buscar representantes' });
            return;
        }
        res.json(results);
    });
});

// Rota para cadastrar usuários
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    
    db.query(sql, [username, hashedPassword], (err, result) => {
        if (err) return res.status(500).send(err.message);
        res.status(201).send('User registered successfully');
    });
});

app.post('/index', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM users WHERE username = ?';

    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Erro ao buscar usuário:', err);
            return res.status(500).json({ success: false });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error('Erro ao comparar senha:', err);
                return res.status(500).json({ success: false });
            }

            if (match) {
                req.session.userId = user.id;
                return res.json({ success: true });
            } else {
                return res.status(401).json({ success: false });
            }
        });
    });
});

//dashboard 
app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }

    // Lógica para renderizar o dashboard ou página principal do sistema
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/api/representantes-com-kg-e-valor', (req, res) => {
    const query = `
        SELECT r.id, r.nome, 
               COALESCE(SUM(d.kg), 0) AS kg, 
               COALESCE(SUM(d.valor), 0) AS valorTotal
        FROM representantes r
        LEFT JOIN dados d ON TRIM(r.nome) = TRIM(d.representante)
        GROUP BY r.id, r.nome;
    `;

    console.log('Executando consulta SQL:', query);

    db.query(query, (error, results) => {
        if (error) {
            console.error('Erro ao buscar representantes com kg e valor:', error);
            res.status(500).json({ error: 'Erro ao buscar representantes com kg e valor' });
        } else {
            console.log('Resultados da consulta SQL:', results);
            res.json(results);
        }
    });
});

// Endpoint para salvar a ordem dos cards
app.post('/api/saveCardOrder', (req, res) => {
    const { user_id, order } = req.body;
    console.log('Recebido para salvar:', { user_id, order }); // Log para depuração

    // Verificar se a conexão está estabelecida
    if (!db) {
        return res.status(500).json({ error: 'Conexão com o banco de dados não estabelecida' });
    }

    // Excluir a ordem antiga
    db.query('DELETE FROM card_order WHERE user_id = ?', [user_id], (err) => {
        if (err) {
            console.error('Erro ao excluir a ordem antiga:', err);
            return res.status(500).json({ error: 'Erro ao excluir a ordem antiga' });
        }

        // Inserir a nova ordem
        const values = order.map((card_id, index) => [user_id, card_id, index + 1]);
        db.query('INSERT INTO card_order (user_id, card_id, position) VALUES ?', [values], (err) => {
            if (err) {
                console.error('Erro ao inserir a nova ordem:', err);
                return res.status(500).json({ error: 'Erro ao inserir a nova ordem' });
            }
            res.json({ success: true });
        });
    });
});

// Endpoint para obter a ordem dos cards
app.get('/api/getCardOrder', (req, res) => {
    const { user_id } = req.query;

    // Verificar se a conexão está estabelecida
    if (!db) {
        return res.status(500).json({ error: 'Conexão com o banco de dados não estabelecida' });
    }

    // Consultar a ordem dos cartões
    db.query('SELECT card_id FROM card_order WHERE user_id = ? ORDER BY position', [user_id], (err, results) => {
        if (err) {
            console.error('Erro ao obter a ordem dos cards:', err);
            return res.status(500).json({ error: 'Erro ao obter a ordem dos cards' });
        }
        const order = results.map(row => row.card_id);
        res.json({ order });
    });
});

// Endpoint para média de PD e Rh
app.get('/api/media', (req, res) => {
    const query = `
        SELECT 
            representante, 
            SUM(kg) AS totalKg, 
            SUM(pd) AS totalPd, 
            CASE WHEN SUM(pd) = 0 THEN 0 ELSE SUM(kg) / SUM(pd) END AS mediaPd,
            SUM(rh) AS totalRh, 
            CASE WHEN SUM(rh) = 0 THEN 0 ELSE SUM(kg) / SUM(rh) END AS mediaRh,
            SUM(pt) AS totalPt,
            CASE WHEN SUM(pt) = 0 THEN 0 ELSE SUM(kg) / SUM(pt) END AS mediaPt
        FROM dados
        GROUP BY representante;
    `;

    console.log('Executando consulta SQL para médias:', query);

    db.query(query, (error, results) => {
        if (error) {
            console.error('Erro ao buscar médias:', error);
            res.status(500).json({ error: 'Erro ao buscar médias' });
        } else {
            console.log('Resultados da consulta SQL para médias:', results);
            res.json(results);
        }
    });
});


// Endpoint para obter lotes
app.get('/api/lote', async (req, res) => {
    const query = `
     SELECT nome FROM lote 
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Erro ao buscar dados de lote:', err);
        res.status(500).json({ error: 'Erro ao buscar dados de lote' });
      } else {
        res.json(results);
      }
    });
  });

// Rota para buscar dados de kg somados por lote
app.get('/api/kg-e-lote', (req, res) => {
    const query = `
      SELECT lote, SUM(kg) as totalKg
      FROM dados 
      GROUP BY lote
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Erro ao buscar dados de kg e lote:', err);
        res.status(500).json({ error: 'Erro ao buscar dados de kg e lote' });
      } else {
        res.json(results);
      }
    });
  });

//rota para salvar o numero de lote
app.post('/api/lote', (req, res) => {
    const { nome, iddados } = req.body;
    const query = 'INSERT INTO lote (nome, iddados) VALUES (?, ?)';
    
    db.query(query, [nome, iddados], (err, result) => {
      if (err) {
        console.error('Error inserting data:', err);
        return res.status(500).json({ error: 'Error inserting data' });
      }
      res.status(201).json({ message: 'Lote inserted successfully' });
    });
  });

// Rota para buscar dados do valor total 
  app.get('/api/valor-lotes', (req, res) => {
    const query = `
      SELECT lote, SUM(Valor) as totalValor
      FROM dados 
      GROUP BY lote
    `;
  
    db.query(query, (err, results) => {
      if (err) {
        console.error('Erro ao buscar dados de valor e lote:', err);
        res.status(500).json({ error: 'Erro ao buscar dados de valor e lote' });
      } else {
        res.json(results);
      }
    });
});

app.post('/api/salvar-edicoes', (req, res) => {
    const dados = req.body;
    console.log('Dados recebidos:', dados);

    const atualizarDados = (item, callback) => {
        const { Npdf, kg, pd, pt, rh, valorkg, Valor, data, hora, fornecedor, sn } = item;
        console.log('Atualizando dados:', { kg, pd, pt, rh, valorkg, Valor, data, hora, fornecedor, sn, Npdf });
        const queryStr = `
            UPDATE dados SET
            kg = ?, pd = ?, pt = ?, rh = ?, valorkg = ?, Valor = ?, data = ?, hora = ?, fornecedor = ?, sn = ?
            WHERE Npdf = ?
        `;
        db.query(queryStr, [kg, pd, pt, rh, valorkg, Valor, data, hora, fornecedor, sn, Npdf], (err, results) => {
            if (err) {
                return callback(err);
            }
            callback(null, results);
        });
    };

    const updatePromises = dados.map(item => {
        return new Promise((resolve, reject) => {
            atualizarDados(item, (err, result) => {
                if (err) {
                    return reject(err);
                }
                resolve(result);
            });
        });
    });

    Promise.all(updatePromises)
        .then(() => res.status(200).json({ message: 'Edições salvas com sucesso' }))
        .catch(err => {
            console.error('Erro ao salvar edições:', err);
            res.status(500).json({ error: 'Erro ao salvar edições' });
        });
});

// // Endpoint para upload de arquivos
// app.post('/upload', upload.single('file'), (req, res) => {
//     const { npdf_id, representante_id } = req.body;
//     const file = req.file;
  
//     if (!file) {
//       return res.status(400).send('Nenhum arquivo enviado.');
//     }
  
//     const { originalname, buffer } = file;
//     const sql = 'INSERT INTO arquivos (nome_original, dados, npdf_id, representante_id) VALUES (?, ?, ?, ?)';
//     db.query(sql, [originalname, buffer, npdf_id, representante_id], (err) => {
//       if (err) {
//         console.error('Erro ao salvar o arquivo no banco de dados:', err);
//         return res.status(500).send('Erro ao salvar o arquivo.');
//       }
//       res.status(200).send('Arquivo enviado com sucesso.');
//     });
//   });

/// Endpoint para buscar e retornar um arquivo
app.get('/file/:id', (req, res) => {
    const { id } = req.params;

    // Consultar o banco de dados para buscar o arquivo
    const query = 'SELECT nome_original, dados FROM arquivos WHERE id = ?';
    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('Erro ao buscar o arquivo no banco de dados:', err);
            res.status(500).send('Erro ao buscar o arquivo no banco de dados');
            return;
        }
        if (results.length === 0) {
            res.status(404).send('Arquivo não encontrado');
            return;
        }

        // Extrair dados do arquivo
        const { nome_original, dados } = results[0];

        // Determinar o tipo MIME com base na extensão do arquivo
        let mimetype = 'application/octet-stream'; // Default
        if (nome_original.endsWith('.jpg') || nome_original.endsWith('.jpeg')) {
            mimetype = 'image/jpeg';
        } else if (nome_original.endsWith('.png')) {
            mimetype = 'image/png';
        } else if (nome_original.endsWith('.pdf')) {
            mimetype = 'application/pdf';
        }

        // Configurar o cabeçalho da resposta
        res.setHeader('Content-Type', mimetype);
        res.send(dados);
    });
});

// Endpoint para buscar lista de arquivos
app.get('/files', (req, res) => {
    const query = 'SELECT id, nome_original FROM arquivos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar arquivos no banco de dados:', err);
            res.status(500).send('Erro ao buscar arquivos no banco de dados');
            return;
        }
        res.json(results);
    });
});

app.get('/api/fotos/:representanteId', (req, res) => {
    const { representanteId } = req.params;

    const query = 'SELECT id, nome_original FROM arquivos WHERE representante_id = ?';
    db.query(query, [representanteId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar fotos no banco de dados:', err);
            return res.status(500).send('Erro ao buscar fotos');
        }
        res.json(results);
    });
});

app.post('/create-folder', async (req, res) => {
    const { folder_name, representante_id } = req.body;
  
    const dir = path.join(__dirname, 'uploads', folder_name);
  
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  
    // Insira a pasta no banco de dados
    const query = 'INSERT INTO pastas (nome, representante_id) VALUES (?, ?)';
    db.query(query, [folder_name, representante_id], (err, result) => {
      if (err) {
        console.error('Erro ao criar pasta no banco de dados:', err);
        res.status(500).send('Erro ao criar pasta');
      } else {
        res.send('Pasta criada com sucesso!');
      }
    });
});

// Endpoint para upload de PDF
app.post('/upload', upload.single('pdfFile'), (req, res) => {
    const representanteId = req.body.representanteId;
    const file = req.file;

    if (!file) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    const query = 'INSERT INTO pdfs (name, data, representante_id) VALUES (?, ?, ?)';
    db.query(query, [file.originalname, file.buffer, representanteId], (err, result) => {
        if (err) {
            console.error('Erro ao salvar o PDF:', err);
            return res.status(500).send('Erro ao salvar o arquivo.');
        }
        res.send('Arquivo salvo com sucesso.');
    });
});


// Rota para exibir o PDF
app.get('/pdfs/:id', (req, res) => {
    const pdfId = req.params.id;
    const query = 'SELECT name, data FROM pdfs WHERE id = ?';

    db.query(query, [pdfId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao buscar o arquivo no banco de dados.');
        }

        if (results.length === 0) {
            return res.status(404).send('Arquivo não encontrado.');
        }

        const pdf = results[0];

        // Configura o cabeçalho para exibir o PDF diretamente no navegador
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="' + pdf.name + '"');
        
        // Envia o PDF para exibição no navegador
        res.send(pdf.data);
    });
});

app.put('/pdfs/:id', (req, res) => {
    const pdfId = req.params.id;
    const novoNome = req.body.novoNome;
    const query = 'UPDATE pdfs SET name = ? WHERE id = ?';

    db.query(query, [novoNome, pdfId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao renomear o arquivo no banco de dados.');
        }

        res.send('Nome do PDF atualizado com sucesso.');
    });
});



// Rota para exibir a lista de PDFs com links para visualização
app.get('/pdfs', (req, res) => {
    const representanteId = req.query.representante_id;
    const query = representanteId
        ? 'SELECT id, name FROM pdfs WHERE representante_id = ?'
        : 'SELECT id, name FROM pdfs';

    db.query(query, [representanteId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao buscar os arquivos no banco de dados.');
        }

        // Retorna a lista de PDFs em formato JSON
        res.json(results);
    });
});

app.delete('/pdfs/:id', (req, res) => {
    const pdfId = req.params.id;
    const query = 'DELETE FROM pdfs WHERE id = ?';

    db.query(query, [pdfId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao deletar o arquivo no banco de dados.');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('PDF não encontrado.');
        }

        res.send('PDF deletado com sucesso.');
    });
});





  


// Middleware para tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


