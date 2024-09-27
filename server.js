const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
const JSZip = require('jszip');
const { promisify } = require('util');
const { PDFDocument } = require('pdf-lib');
const ExcelJS = require('exceljs');


// Inicializar o Express
const app = express();
const PORT = process.env.PORT || 3001;

// Criação da conexão
const db = mysql.createConnection({
    host: '192.168.0.177',
    user: 'tiago',
    password: '1234',
    database: 'sys'
});

// Conectar ao banco de dados
db.connect(err => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        return;
    }
    console.log('Conectado ao banco de dados.');
});

// Definir uma rota simples
app.get('/index.html', (req, res) => {
    res.send(__dirname + '/public/index.html');
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

/*const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão armazenados
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo com timestamp
    }
});*/

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

// Função para remover pontos usados como separadores de milhar e preservar vírgulas como decimais
function formatNumber(value) {
    return value.replace(/\.(?=\d{3}(?:\D|$))/g, '');
}

// Função para extrair dados do PDF
function extractPDFData(text) {
    // Regex para capturar os valores na tabela
    const tableRegex = /(\d[.,]\d+)\s*(\d{1,3}[.,]\d{4})\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+[.,]\d+)\s*(\d[.,]\d{4})\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+[.,]\d+)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d+)?|\d+[.,]\d+)/gm;
    const dataRegex = /Data\/Hora:\s+(\d{2}\/\d{2}\/\d{4})/;
    const horaRegex = /\b\d{2}:\d{2}\b/i;
    const representanteRegex = /Apelido\s+([A-Za-z]+)\s+[A-Za-z]+/;
    const fornecedorRegex = /(?:\n|^)([A-Za-z]+\s+[A-Za-z]+(?:\s+[A-Za-z]+)*)\s*Comprador/;
    const snRegex = /SN-\d+/;

    const tableData = [];
    let match;

    // Itera sobre todas as correspondências na tabela
    while ((match = tableRegex.exec(text)) !== null) {
        // Formata os valores capturados
        const data = {
            kg: formatNumber(match[1]),
            pd: formatNumber(match[2]),
            pt: formatNumber(match[3]),
            rh: formatNumber(match[4]),
            valorKg: formatNumber(match[5]),
            valor: formatNumber(match[6])
        };

        // Captura e adiciona a data
        const dataMatch = dataRegex.exec(text);
        if (dataMatch) {
            console.log("Data encontrada:", dataMatch[1]);
            data.data = dataMatch[1];
        } else {
            console.log("Data não encontrada");
        }

        // Captura e adiciona a hora
        const horaMatch = horaRegex.exec(text);
        if (horaMatch) {
            console.log("Hora encontrada:", horaMatch[0]);
            data.hora = horaMatch[0];
        } else {
            console.log("Hora não encontrada");
        }

        // Captura e adiciona o representante
        const representanteMatch = representanteRegex.exec(text);
        if (representanteMatch) {
            console.log("Representante encontrado:", representanteMatch[1]);
            data.representante = representanteMatch[1];
        } else {
            console.log("Representante não encontrado");
        }

        // Captura e adiciona o fornecedor
        const fornecedorMatch = fornecedorRegex.exec(text);
        if (fornecedorMatch) {
            console.log("Fornecedor encontrado:", fornecedorMatch[1]);
            data.fornecedor = fornecedorMatch[1];
        } else {
            console.log("Fornecedor não encontrado");
        }

        // Captura e adiciona o SN
        const snRegexMatch = snRegex.exec(text);
        if (snRegexMatch) {
            console.log("SN encontrado:", snRegexMatch[0]);
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

    const insertQuery = 'INSERT INTO dados (Npdf, kg, pd, pt, rh, valorKg, valor, data, hora, representante, fornecedor, sn, lote, tipo, hedge) VALUES ?';
    const values = data.map(row => [row.Npdf, row.kg, row.pd, row.pt, row.rh, row.valorKg, row.valor, row.data, row.hora, row.representante, row.fornecedor, row.sn, row.lote, row.tipo, row.hedge]);

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
    secret: 'seu_segredo', // Mantenha isso em segredo
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Para desenvolvimento, use false; em produção, use true com HTTPS
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

// Arquivo Pecas 
app.get('/public/exibirPecas.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'exibirPecas.html'));
});

// Arquivo Pecas 
app.get('/public/dashboardPecas.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboardPecas.html'));
});

// Arquivo pecas
app.get('/public/Pecas.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Pecas.html'));
});

// Servir o arquivo Financeiro.html
app.get('/public/Financeiro.html', verificarNivelAcesso('finance'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Financeiro.html'));
});


// Servir o arquivo Financeiro.html
app.get('/public/pecasArchive.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pecasArchive.html'));
});

// Servir o arquivo usuarioCadastro.html
app.get('/public/usuariosCadastro.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'usuariosCadastro.html'));
});

// Servir o arquivo usuarioCadastro.html
app.get('/public/envioDados.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'envioDados.html'));
});

// Servir o arquivo usuarioCadastro.html
app.get('/configuracaoPage/cadastroLote.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public ', 'cadastroLote.html'));
});



app.get('/api/dados', (req, res) => {
    const sql = "SELECT * FROM dados";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar dados:", err);
            return res.status(500).send("Erro ao buscar dados do banco de dados.");
        }

        console.log("Dados recebidos do banco de dados:", results); // Adicione este log

        // Processar e formatar os resultados
        const processedResults = results.map(item => {
            let valor = item.Valor;

            if (valor) {
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


app.delete('/api/dados/:id', (req, res) => {
    const id = req.params.id;

    if (!id) {
        return res.status(400).send("ID não fornecido");
    }

    const sql = "DELETE FROM dados WHERE iddados = ?";
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Erro ao excluir dado:", err);
            return res.status(500).send("Erro ao excluir dado do banco de dados.");
        }

        res.send("Dado excluído com sucesso.");
    });
});

//rota PUT para atualizar dados
app.put('/dados/:id', (req, res) => {
    const id = req.params.id;

    // Verificar se req.body está definido e contém os campos esperados
    if (!req.body) {
        return res.status(400).send('O corpo da solicitação está vazio.');
    }

    const { Npdf, kg, pd, pt, rh, valorkg, Valor, tipo, data, hora, fornecedor, sn, lote } = req.body;

    // Verificar se todos os campos necessários estão presentes
    if (Npdf === undefined || kg === undefined || pd === undefined || pt === undefined || rh === undefined ||
        valorkg === undefined || Valor === undefined || tipo === undefined || data === undefined || hora === undefined ||
        fornecedor === undefined || sn === undefined || lote === undefined) {
        return res.status(400).send('Faltam campos no corpo da solicitação.');
    }

    const query = `
        UPDATE dados
        SET Npdf = ?, kg = ?, pd = ?, pt = ?, rh = ?, valorkg = ?, Valor = ?, tipo = ?, data = ?, hora = ?, fornecedor = ?, sn = ?, lote = ?
        WHERE iddados = ?
    `;

    db.query(query, [Npdf, kg, pd, pt, rh, valorkg, Valor, tipo, data, hora, fornecedor, sn, lote, id], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar dado:', err);
            return res.status(500).send('Erro ao atualizar dado');
        }

        if (results.affectedRows === 0) {
            return res.status(404).send('Dado não encontrado');
        }

        res.send('Dado atualizado com sucesso');
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
    const loteSelecionado = req.query.lote;  // Captura o parâmetro 'lote' da query string

    console.log('Nome do Representante:', nomeRepresentante);
    console.log('Lote Selecionado:', loteSelecionado);

    // Adapte sua query SQL para considerar o lote, se aplicável
    const query = 'SELECT * FROM dados WHERE LOWER(representante) LIKE ? AND lote = ?';
    db.query(query, [`%${nomeRepresentante.toLowerCase()}%`, loteSelecionado], (err, results) => {
        if (err) {
            console.error('Erro ao executar a consulta:', err);
            res.status(500).send('Erro no servidor');
            return;
        }

        console.log('Resultados da consulta lote:', results);
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
                    return res.status(400).json({ error: 'Representante não encontrado.' });
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

app.put('/api/representantes/:id', async (req, res) => {
    const representanteId = parseInt(req.params.id);
    const { nome } = req.body;

    if (isNaN(representanteId) || !nome) {
        return res.status(400).json({ success: false, error: 'Dados inválidos para a atualização' });
    }

    try {
        // Obter o nome antigo do representante antes de atualizar
        const [oldNameResult] = await db.promise().query('SELECT nome FROM representantes WHERE id = ?', [representanteId]);
        const oldName = oldNameResult[0]?.nome;

        if (!oldName) {
            return res.status(404).json({ success: false, error: 'Representante não encontrado' });
        }

        // Inicia a transação
        await db.promise().beginTransaction();

        // Atualiza o nome na tabela de representantes
        const updateRepresentanteSql = `
            UPDATE representantes 
            SET nome = ? 
            WHERE id = ?
        `;
        await db.promise().query(updateRepresentanteSql, [nome, representanteId]);

        // Atualiza o nome na tabela de dados para o representante correspondente
        const updateDadosSql = `
            UPDATE dados 
            SET representante = ? 
            WHERE representante = ?
        `;
        await db.promise().query(updateDadosSql, [nome, oldName]);

        // Confirma a transação
        await db.promise().commit();

        res.json({ success: true, message: 'Representante e dados atualizados com sucesso!' });
    } catch (err) {
        // Desfaz a transação em caso de erro
        await db.promise().rollback();
        console.error('Erro ao atualizar o representante:', err);
        res.status(500).json({ success: false, error: 'Erro ao atualizar o representante e dados' });
    }
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
    const loteSelecionado = req.query.lote;  // Captura o parâmetro 'lote' da query string
    let query = 'SELECT * FROM dados';
    let queryParams = [];

    if (loteSelecionado) {
        query += ' WHERE lote = ?';
        queryParams.push(loteSelecionado);
    }

    db.query(query, queryParams, (err, results) => {
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
            return res.status(500).json({ success: false, message: 'Erro interno.' });
        }

        if (results.length === 0) {
            return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });
        }

        const user = results[0];

        bcrypt.compare(password, user.password, (err, match) => {
            if (err) {
                console.error('Erro ao comparar senha:', err);
                return res.status(500).json({ success: false, message: 'Erro interno.' });
            }

            if (match) {
                req.session.user = { id: user.id, access_level: user.access_level }; // Armazenar ID e nível de acesso na sessão
                return res.json({ success: true, access_level: user.access_level });
            } else {
                return res.status(401).json({ success: false, message: 'Senha incorreta.' });
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
     SELECT id, nome FROM lote 
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

// Função auxiliar para obter o nome do representante
const obterNomeRepresentante = (representanteId, callback) => {
    db.query('SELECT nome FROM representantes WHERE id = ?', [representanteId], (err, rows) => {
        if (err) {
            return callback(err);
        }
        if (rows.length === 0) {
            return callback(new Error('Representante não encontrado'));
        }
        callback(null, rows[0].nome);
    });
};


// Endpoint para upload de arquivos
app.post('/upload', upload.fields([{ name: 'pdfFiles', maxCount: 200 }, { name: 'photoFiles', maxCount: 10 }]), (req, res) => {
    const representanteId = req.body.representanteId;
    const lote = req.body.lote; // Obtém o lote do corpo da requisição
    const npdf = req.body.npdf;
    const pdfFiles = req.files['pdfFiles'] || [];
    const photoFiles = req.files['photoFiles'] || [];

    if (pdfFiles.length === 0 && photoFiles.length === 0) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    // Verificar se o representante ID é válido
    db.query('SELECT COUNT(*) AS count FROM representantes WHERE id = ?', [representanteId], (err, rows) => {
        if (err) {
            console.error('Erro ao verificar representante:', err);
            return res.status(500).send('Erro ao verificar o representante.');
        }

        if (rows[0].count === 0) {
            return res.status(400).send('ID do representante inválido.');
        }

        // Obter o nome do representante
        obterNomeRepresentante(representanteId, (err, nomeRepresentante) => {
            if (err) {
                console.error('Erro ao obter o nome do representante:', err);
                return res.status(500).send('Erro ao obter o nome do representante.');
            }

        let queries = [];
        let queryParams = [];

        pdfFiles.forEach(file => {
            const newFilename = `${npdf} - ${nomeRepresentante}.pdf`;
            queries.push('INSERT INTO pdfs (name, data, representante_id, npdf, lote) VALUES (?, ?, ?, ?, ?)');
            queryParams.push([newFilename, file.buffer, representanteId, npdf, lote]);
        });

        photoFiles.forEach(file => {
            queries.push('INSERT INTO photos (name, data, representante_id, npdf, lote) VALUES (?, ?, ?, ?, ?)');
            queryParams.push([file.originalname, file.buffer, representanteId, npdf, lote]);
        });

        // Função para executar a query de inserção
        const saveFile = (query, params, callback) => {
            db.query(query, params, (err, result) => {
                if (err) {
                    return callback(err);
                }
                callback(null, result);
            });
        };

        // Executar todas as queries
        let completedQueries = 0;
        const totalQueries = queries.length;

        const onQueryComplete = (err) => {
            if (err) {
                console.error('Erro ao salvar arquivos:', err);
                return res.status(500).send('Erro ao salvar os arquivos.');
            }

            completedQueries++;
            if (completedQueries === totalQueries) {
                res.send('Arquivos salvos com sucesso.');
            }
        };

        if (totalQueries === 0) {
            return res.send('Nenhum arquivo para salvar.');
        }

        queries.forEach((query, index) => {
            saveFile(query, queryParams[index], onQueryComplete);
        });
    });
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
    const loteId = req.query.lote_id;

    let query = 'SELECT * FROM pdfs WHERE 1=1';
    let params = [];

    if (representanteId) {
        query += ' AND representante_id = ?';
        params.push(representanteId);
    }

    if (loteId) {
        query += ' AND lote = ?';
        params.push(loteId);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar PDFs:', err);
            return res.status(500).send('Erro ao buscar PDFs.');
        }
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


// Função para ordenar por ordem numérica com base no nome dos PDFs de cada representante
function sortByNumericOrder(pdfs) {
    return pdfs.sort((a, b) => {
        const numA = a.name.match(/\d+/) ? parseInt(a.name.match(/\d+/)[0], 10) : 0;
        const numB = b.name.match(/\d+/) ? parseInt(b.name.match(/\d+/)[0], 10) : 0;
        return numA - numB;
    });
}

app.get('/download-pdfs', async (req, res) => {
    const representanteIds = req.query.representante_ids ? req.query.representante_ids.split(',') : [];
    const lote = req.query.lote;
    const option = req.query.option;

    // Construção da query SQL com ordenação por nome do representante
    let queryStr = `
        SELECT p.name, p.data, r.nome AS representante_nome 
        FROM pdfs p
        JOIN representantes r ON p.representante_id = r.id
        WHERE 1=1
    `;
    let queryParams = [];

    // Filtro por representantes
    if (representanteIds.length > 0) {
        queryStr += ' AND p.representante_id IN (?)';
        queryParams.push(representanteIds);
    }

    // Filtro por lote
    if (lote) {
        queryStr += ' AND p.lote = ?';
        queryParams.push(lote);
    }

    // Ordenar os PDFs pelo nome do representante
    queryStr += ' ORDER BY r.nome ASC, p.name ASC';

    try {
        // Executa a query para buscar os PDFs
        const pdfs = await promisify(db.query).bind(db)(queryStr, queryParams);

        // Agrupar PDFs por representante
        const groupedPdfs = pdfs.reduce((acc, pdf) => {
            if (!acc[pdf.representante_nome]) {
                acc[pdf.representante_nome] = [];
            }
            acc[pdf.representante_nome].push(pdf);
            return acc;
        }, {});

        if (option === 'unify') {
            const mergedPdf = await PDFDocument.create();

            // Unificar os PDFs por representante em ordem numérica
            for (const representanteNome in groupedPdfs) {
                const representativePdfs = groupedPdfs[representanteNome];

                // Ordena os PDFs numericamente para cada representante
                const sortedPdfs = sortByNumericOrder(representativePdfs);

                // Adiciona as páginas dos PDFs ao documento unificado
                for (const pdf of sortedPdfs) {
                    if (pdf.data && pdf.data.toString('utf-8').startsWith('%PDF-')) {
                        const pdfDoc = await PDFDocument.load(pdf.data);
                        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                        copiedPages.forEach((page) => mergedPdf.addPage(page));
                    } else {
                        console.error(`Arquivo inválido ou corrompido: ${pdf.name}`);
                    }
                }
            }

            const mergedPdfBytes = await mergedPdf.save();

            res.setHeader('Content-Disposition', 'attachment; filename="unified_pdfs.pdf"');
            res.setHeader('Content-Type', 'application/pdf');
            res.send(Buffer.from(mergedPdfBytes));
        } else {
            const zip = new JSZip();
            const zipFolder = zip.folder('pdfs');

            for (const representanteNome in groupedPdfs) {
                const sortedPdfs = sortByNumericOrder(groupedPdfs[representanteNome]);

                for (const pdf of sortedPdfs) {
                    if (pdf.data) {
                        let buffer = Buffer.isBuffer(pdf.data) ? pdf.data : Buffer.from(pdf.data, 'binary');
                        zipFolder.file(pdf.name, buffer);
                    }
                }
            }

            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

            res.setHeader('Content-Disposition', 'attachment; filename="pdfs.zip"');
            res.setHeader('Content-Type', 'application/zip');
            res.send(zipBuffer);
        }
    } catch (error) {
        console.error('Erro ao buscar PDFs:', error);
        res.status(500).send('Erro ao buscar PDFs do banco de dados.');
    }
});


app.get('/photos', (req, res) => {
    const representanteId = req.query.representante_id;
    const loteId = req.query.lote_id;

    let query = 'SELECT * FROM photos WHERE 1=1';
    let params = [];

    if (representanteId) {
        query += ' AND representante_id = ?';
        params.push(representanteId);
    }

    if (loteId) {
        query += ' AND lote = ?';
        params.push(loteId);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar Fotos:', err);
            return res.status(500).send('Erro ao buscar Fotos.');
        }
        res.json(results);
    });
});


// Rota para obter os lotes com base no representante selecionado
app.get('/api/lotes', (req, res) => {
    const representante = req.query.representante;

    if (!representante) {
        return res.status(400).send('Representante é necessário.');
    }

    // Verificar o valor recebido
    console.log('Representante recebido:', representante);

    const query = `
        SELECT DISTINCT lote
        FROM dados
        WHERE representante = ?
    `;

    db.query(query, [representante], (err, results) => {
        if (err) {
            console.error('Erro ao buscar lotes:', err);
            return res.status(500).send('Erro ao buscar lotes.');
        }

        // Verificar os resultados da consulta
        console.log('Lotes encontrados:', results);
        res.json(results.map(result => ({ lote: result.lote })));
    });
});



// Rota para obter os Npdfs com base no representante e lote selecionados
app.get('/api/npdfs', (req, res) => {
    const representante = req.query.representante;
    const lote = req.query.lote;

    if (!representante || !lote) {
        return res.status(400).send('Representante e lote são necessários.');
    }

    const query = `
        SELECT DISTINCT Npdf
        FROM dados
        WHERE representante = ? AND lote = ?
    `;

    db.query(query, [representante, lote], (err, results) => {
        if (err) {
            console.error('Erro ao buscar Npdfs:', err);
            return res.status(500).send('Erro ao buscar Npdfs.');
        }
        res.json(results);
    });
});

// Endpoint para obter uma foto
app.get('/photos/:id', (req, res) => {
    const photosId = req.params.id;
    const query = 'SELECT name, data FROM photos WHERE id = ?';

    db.query(query, [photosId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao buscar o arquivo no banco de dados.');
        }

        if (results.length === 0) {
            return res.status(404).send('Arquivo não encontrado.');
        }

        const photos = results[0];

        // Configura o cabeçalho para exibir o PDF diretamente no navegador
        res.setHeader('Content-Type', 'application/photos');
        res.setHeader('Content-Disposition', 'inline; filename="' + photos.name + '"');

        // Envia o PDF para exibição no navegador
        res.send(photos.data);
    });
});

// Endpoint para renomear uma foto
app.put('/photos/:id', (req, res) => {
    const photosId = req.params.id;
    const novoNome = req.body.novoNome;
    const query = 'UPDATE photos SET name = ? WHERE id = ?';

    db.query(query, [novoNome, photosId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao renomear o arquivo no banco de dados.');
        }

        res.send('Nome da FOTO atualizado com sucesso.');
    });
});

// Endpoint para deletar uma foto
app.delete('/photos/:id', (req, res) => {
    const fotoId = req.params.id;
    const query = 'DELETE FROM photos WHERE id = ?';

    db.query(query, [fotoId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao deletar o arquivo no banco de dados.');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('FOTO não encontrado.');
        }

        res.send('FOTO deletado com sucesso.');
    });
});

// Função para buscar o maior número de peça existente para uma combinação específica de representante e lote
const getMaxPieceNumberForRepAndLot = (representante, lote) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT MAX(npeca) AS maxNpeca FROM pecas WHERE representante_id = ? AND lote = ?', [representante, lote], (err, results) => {
            if (err) return reject(err);
            resolve(results[0].maxNpeca || 0);
        });
    });
};

// Função para atualizar o maior número de peça para uma combinação específica de representante e lote
const updateMaxPieceNumberForRepAndLot = (representante, lote, maxNpeca) => {
    return new Promise((resolve, reject) => {
        db.query('INSERT INTO pecas_metadata (representante_id, lote, max_npeca) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE max_npeca = ?', [representante, lote, maxNpeca, maxNpeca], (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

// Endpoint para salvar dados extraídos
app.post('/api/save-extracted-data', async (req, res) => {
    console.log('Dados recebidos:', req.body); // Adicione este log para depuração
    const { tipo, modelo, codigo, quantidade, valor, representantes, clientes, lotes } = req.body;

    // Verifica se todos os arrays têm o mesmo comprimento
    if (tipo.length !== modelo.length || tipo.length !== codigo.length || tipo.length !== quantidade.length || tipo.length !== valor.length || tipo.length !== clientes.length || (lotes && tipo.length !== lotes.length)) {
        console.error('Os arrays de dados têm comprimentos diferentes.');
        return res.status(400).send('Dados inconsistentes.');
    }

    try {
        // Inicializa um objeto para armazenar números de peças por combinação de representante e lote
        const pieceNumbersByRepAndLot = {};

        const values = await Promise.all(tipo.map(async (t, i) => {
            const lote = lotes[i] || '';
            const representante = representantes[i] || null;

            // Se ainda não estiver calculado para essa combinação, busca o maior número de peça
            if (!pieceNumbersByRepAndLot[representante]) {
                pieceNumbersByRepAndLot[representante] = {};
            }
            if (!pieceNumbersByRepAndLot[representante][lote]) {
                const maxPieceNumberForRepAndLot = await getMaxPieceNumberForRepAndLot(representante, lote);
                pieceNumbersByRepAndLot[representante][lote] = maxPieceNumberForRepAndLot + 1;
            }

            // Obtem o número da peça atual e incrementa
            const npeca = pieceNumbersByRepAndLot[representante][lote];
            pieceNumbersByRepAndLot[representante][lote] += 1;

            return [
                representante, // Nome do representante, ou null se não houver
                clientes[i] || '',
                t,
                modelo[i] || '',
                codigo[i] || '',
                quantidade[i] || '',
                valor[i] || '',
                lote,
                npeca // Número da peça
            ];
        }));

        // Salva os dados
        const sql = 'INSERT INTO pecas (representante_id, clientes, tipo, modelo, codigo, quantidade, valor, lote, npeca) VALUES ?';

        await new Promise((resolve, reject) => {
            db.query(sql, [values], (err, result) => {
                if (err) {
                    console.error('Erro ao salvar dados:', err);
                    return reject(err);
                }
                resolve(result);
            });
        });

        // Atualiza o número máximo de peça para cada combinação de representante e lote
        await Promise.all(Object.keys(pieceNumbersByRepAndLot).flatMap(rep => {
            return Object.keys(pieceNumbersByRepAndLot[rep]).map(lote => {
                return updateMaxPieceNumberForRepAndLot(rep, lote, pieceNumbersByRepAndLot[rep][lote] - 1);
            });
        }));

        res.status(200).send('Dados salvos com sucesso.');
    } catch (error) {
        console.error('Erro ao processar os dados:', error);
        res.status(500).send('Erro ao salvar os dados.');
    }
});


// Endpoint para obter as peças filtradas por representante e lote
app.get('/api/representantes/:id/pecas', (req, res) => {
    const representanteId = req.params.id;
    const lote = req.query.lote;

    let query = `
        SELECT npeca, clientes, tipo, modelo, codigo, quantidade, valor
        FROM pecas
        WHERE representante_id = ?
    `;

    const params = [representanteId];

    if (lote) {
        query += ` AND lote = ?`;
        params.push(lote);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar peças:', err);
            return res.status(500).send('Erro ao buscar peças.');
        }
        res.json(results);
    });
});

// Endpoint para obter resumo das peças com base no lote
app.get('/api/pecas/resumo', (req, res) => {
    const lote = req.query.lote || '%'; // `%` para buscar todos os lotes

    const query = `
        SELECT 
    r.nome AS representante_nome,
    SUM(p.quantidade) AS total_pecas,
    SUM(p.valor) AS valor_total
FROM pecas p
LEFT JOIN representantes r ON p.representante_id = r.id
WHERE p.lote LIKE ?
GROUP BY r.nome, p.representante_id;

    `;

    db.query(query, [lote], (err, results) => {
        if (err) {
            console.error('Erro ao buscar resumo das peças:', err);
            return res.status(500).send('Erro ao buscar resumo das peças.');
        }

        if (results.length === 0) {
            return res.status(404).send('Nenhuma peça encontrada.');
        }

        res.json(results);
    });
});

// Endpoint para obter resumo das peças por tipo com base no lote
app.get('/api/pecas/resumo-por-tipo', async (req, res) => {
    const tipoPeca = req.query.tipo || '%'; // `%` para buscar todos os tipos
    const lote = req.query.lote || '%'; // `%` para buscar todos os lotes

    const query = `
        SELECT 
            representantes.nome AS representante_nome,
            pecas.tipo AS tipo_peca,
            SUM(pecas.quantidade) AS total_pecas,
            SUM(pecas.valor) AS valor_total
        FROM pecas
        JOIN representantes ON pecas.representante_id = representantes.id
        WHERE pecas.tipo LIKE ? AND pecas.lote LIKE ?
        GROUP BY representantes.nome, pecas.tipo;
    `;

    db.query(query, [tipoPeca, lote], (err, results) => {
        if (err) {
            console.error('Erro ao buscar resumo das peças:', err);
            return res.status(500).send('Erro ao buscar resumo das peças.');
        }

        if (results.length === 0) {
            return res.status(404).send('Nenhuma peça encontrada.');
        }

        res.json(results);
    });
});


// Rota para registrar um novo representante
app.post('/api/representantes_financeiros', (req, res) => {
    const { nome, associado } = req.body;
    const sql = 'INSERT INTO representantes_financeiros (nome, associado) VALUES (?, ?)';

    db.query(sql, [nome, associado], (err, results) => {
        if (err) {
            console.error('Erro ao adicionar representante financeiro:', err);
            return res.status(500).json({ message: 'Erro ao adicionar representante financeiro', error: err });
        }
        res.status(201).json({ message: 'Representante financeiro adicionado com sucesso' });
    });
});

// Rota para listar todos os representantes
app.get('/api/representantes_financeiros', (req, res) => {
    const query = 'SELECT * FROM representantes_financeiros';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
});

// Rota para adicionar um novo registro financeiro
app.post('/api/registros_financeiros', (req, res) => {
    const { representante_id, data, hora, comprador, valor_debito, valor_credito, pagamento, observacoes, associado } = req.body;

    // Validar se o representante_id não é nulo
    if (!representante_id) {
        return res.status(400).json({ error: 'O ID do representante é obrigatório' });
    }

    // Inserir o registro financeiro no banco de dados
    const query = `INSERT INTO registros_financeiros (representante_id, data, hora, comprador, valor_debito, valor_credito, pagamento, observacoes, associado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? )`;
    db.query(query, [representante_id, data, hora, comprador, valor_debito, valor_credito, pagamento, observacoes, associado], (error, results) => {
        if (error) {
            console.error('Erro ao inserir registro financeiro:', error);
            return res.status(500).json({ error: 'Erro ao salvar o registro financeiro' });
        }
        res.status(201).json({ message: 'Registro financeiro salvo com sucesso!' });
    });
});

// Rota para obter todos os registros financeiros
app.get('/api/registros_financeiros', (req, res) => {
    const representanteId = req.query.representante_id;

    // Consulta SQL para obter registros financeiros com o nome do comprador
    const query = `
        SELECT rf.id, rf.data, rf.hora, COALESCE(c.nome, rf.comprador) AS comprador, rf.valor_debito, rf.valor_credito, rf.pagamento, rf.observacoes
        FROM registros_financeiros rf
        LEFT JOIN compradores c ON rf.comprador = c.id
        WHERE rf.representante_id = ?
    `;

    db.query(query, [representanteId], (error, results) => {
        if (error) {
            console.error('Erro ao buscar registros financeiros:', error);
            return res.status(500).json({ error: 'Erro ao buscar registros financeiros' });
        }
        res.json(results);
    });
});

app.put('/api/registros_financeiros/:id', (req, res) => {
    const { id } = req.params; // O ID do registro a ser atualizado
    const { representante_id, data, hora, comprador, valor_debito, valor_credito, pagamento, observacoes } = req.body;

    const query = `
        UPDATE registros_financeiros
        SET representante_id = ?, data = ?, hora = ?, comprador = ?, valor_debito = ?, valor_credito = ?, pagamento = ? , observacoes = ?
        WHERE id = ?
    `;

    db.query(query, [representante_id, data, hora, comprador, valor_debito, valor_credito, pagamento, observacoes, id], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar registro financeiro:', err);
            return res.status(500).send(err);
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Registro não encontrado');
        }
        res.status(200).send({ id, representante_id, data, comprador, valor_debito, valor_credito, observacoes });
    });
});

app.get('/api/registros_financeiros_para_pdf', (req, res) => {
    const representanteId = req.query.representante_id;
    const dataInicio = req.query.data_inicio; // no formato aaaa-mm-dd
    const dataFim = req.query.data_fim; // no formato aaaa-mm-dd

    if (!representanteId || !dataInicio || !dataFim) {
        return res.status(400).json({ error: 'Faltando parâmetros' });
    }

    // Consulta SQL para filtrar registros por intervalo de datas
    const query = `
        SELECT * FROM registros_financeiros
        WHERE representante_id = ? 
        AND data BETWEEN ? AND ?
    `;

    db.query(query, [representanteId, dataInicio, dataFim], (error, results) => {
        if (error) {
            console.error('Erro ao buscar registros financeiros para PDF:', error);
            return res.status(500).json({ error: 'Erro ao buscar registros financeiros para PDF' });
        }
        res.json(results);
    });
});


app.delete('/api/registros_financeiros/:id', (req, res) => {
    const id = req.params.id;

    const query = `DELETE FROM registros_financeiros WHERE id = ?`;
    db.query(query, [id], (error, results) => {
        if (error) {
            console.error('Erro ao excluir registro financeiro:', error);
            return res.status(500).json({ error: 'Erro ao excluir o registro financeiro' });
        }
        res.status(200).json({ message: 'Registro financeiro excluído com sucesso!' });
    });
});

// Atualizar um dado existente
app.put('/dados/:id', (req, res) => {
    const id = req.params.id;
    const { Npdf, kg, pd, pt, rh, valorkg, Valor, tipo, data, hora, fornecedor, sn } = req.body;

    const query = `
        UPDATE dados
        SET Npdf = ?, kg = ?, pd = ?, pt = ?, rh = ?, valorkg = ?, Valor = ?, tipo = ?, data = ?, hora = ?, fornecedor = ?, sn = ?
        WHERE iddados = ?
    `;

    db.query(query, [Npdf, kg, pd, pt, rh, valorkg, Valor, tipo, data, hora, fornecedor, sn, id], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar dado:', err);
            return res.status(500).send('Erro ao atualizar dado');
        }

        res.send('Dado atualizado com sucesso');
    });
});

// Rota para obter todos os registros financeiros // EXCEL
app.get('/api/registros_financeiros_todos', (req, res) => {
    // Consulta SQL para obter todos os registros financeiros
    const query = `
        SELECT rf.id, rf.data, rf.hora, COALESCE(c.nome, rf.comprador) AS comprador, rf.valor_debito, rf.valor_credito, rf.pagamento, rf.observacoes, rf.representante_id, r.nome AS representante_nome
        FROM registros_financeiros rf
        LEFT JOIN compradores c ON rf.comprador = c.id
        LEFT JOIN representantes r ON rf.representante_id = r.id
    `;

    db.query(query, (error, results) => {
        if (error) {
            console.error('Erro ao buscar registros financeiros:', error);
            return res.status(500).json({ error: 'Erro ao buscar registros financeiros' });
        }
        res.json(results);
    });
});


// Exemplo de rota usando Express.js
app.post('/api/contagem', async (req, res) => {
    const { representanteId, contagem } = req.body;

    try {
        // Verificar se já existe uma entrada para esse representante
        const [existingEntry] = db.query(
            'SELECT contagem FROM contagem_representantes WHERE representante_id = ?',
            [representanteId]
        );

        if (existingEntry) {
            // Atualizar a contagem existente
            db.query(
                'UPDATE contagem_representantes SET contagem = ? WHERE representante_id = ?',
                [contagem, representanteId]
            );
        } else {
            // Inserir nova entrada para o representante
            db.query(
                'INSERT INTO contagem_representantes (representante_id, contagem) VALUES (?, ?)',
                [representanteId, contagem]
            );
        }

        res.status(200).send({ message: 'Contagem atualizada com sucesso.' });
    } catch (error) {
        res.status(500).send({ error: 'Erro ao salvar a contagem.' });
    }
});

app.post('/api/compradores', (req, res) => {
    const { nome, representante_id, cpf_cnpj } = req.body;

    // Remover formatação de CPF/CNPJ
    const cpfCnpjLimpo = cpf_cnpj.replace(/[^\d]+/g, '');

    // Verificar se já existe um comprador com o mesmo CPF/CNPJ e representante
    const checkQuery = 'SELECT * FROM compradores WHERE cpf_cnpj = ? AND representante_id = ?';
    db.query(checkQuery, [cpfCnpjLimpo, representante_id], (err, results) => {
        if (err) return res.status(500).send(err);

        if (results.length > 0) {
            return res.status(400).send('Comprador com o mesmo CPF/CNPJ e representante já cadastrado.');
        }

        // Se não houver duplicidade, prosseguir com a inserção
        const insertQuery = 'INSERT INTO compradores (nome, representante_id, cpf_cnpj) VALUES (?, ?, ?)';
        db.query(insertQuery, [nome, representante_id, cpfCnpjLimpo], (err, result) => {
            if (err) return res.status(500).send(err);
            res.status(201).send({ id: result.insertId, nome, representante_id, cpf_cnpj: cpfCnpjLimpo });
        });
    });
});


//verifica duplicidade ao cadastrar comprador
app.get('/api/verificar_comprador', (req, res) => {
    const { cpf_cnpj, representante_id } = req.query;
    const query = 'SELECT * FROM compradores WHERE cpf_cnpj = ? AND representante_id = ?';
    
    db.query(query, [cpf_cnpj, representante_id], (err, results) => {
        if (err) return res.status(500).send(err);
        
        // Se houver resultados, significa que existe um comprador com o mesmo CPF/CNPJ e representante
        if (results.length > 0) {
            return res.status(400).send('Comprador já cadastrado.');
        }
        
        // Se não houver duplicidade, retorna OK
        res.sendStatus(200);
    });
});




// Endpoint para listar compradores associados a um representante
app.get('/api/compradores', (req, res) => {
    const representanteId = req.query.representante_id;
    const query = 'SELECT * FROM compradores WHERE representante_id = ?';
    db.query(query, [representanteId], (err, results) => {
        if (err) return res.status(500).send(err);
        res.send(results);
    });
});

// Endpoint para retornar todos os tipos de pagamento
app.get('/api/tipo_pagamento', (req, res) => {
    const query = 'SELECT * FROM pagamento';
    db.query(query, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results); // Retorna os resultados como JSON
    });
});

// Endpoint para obter saldos dos representantes
app.get('/api/representantes_financeiros/saldos', (req, res) => {
    const query = `
      SELECT r.nome,
             COALESCE(SUM(d.valor_debito), 0) AS total_debito,
             COALESCE(SUM(d.valor_credito), 0) AS total_credito,
             COALESCE(SUM(d.valor_credito - d.valor_debito), 0) AS saldo
      FROM representantes_financeiros r
      LEFT JOIN registros_financeiros d ON r.id = d.representante_id
      GROUP BY r.id, r.nome;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).send('Erro ao buscar saldos');
            return;
        }
        res.json(results);
    });
});

// Endpoint para obter saldos dos representantes
app.get('/api/representantes_financeiros/geral', (req, res) => {
    const lote = req.query.lote; // Obtém o lote da query string

    let query = `
SELECT
    r.nome AS representante,
    COALESCE(dados_soma.total_kg, 0) AS total_kg,
    COALESCE(pecas_soma.valor_total_pecas, 0) AS total_valor_pecas,
    COALESCE(dados_soma.compra_catalisador, 0) AS compra_catalisador,
    COALESCE(adiantamentos_soma.saldo_adiantamentos, 0) AS saldo_adiantamentos,
    COALESCE(dados_soma.compra_catalisador, 0) + COALESCE(adiantamentos_soma.saldo_adiantamentos, 0) AS saldo
FROM
    representantes r
LEFT JOIN (
    SELECT 
        representante AS nome, 
        SUM(kg) AS total_kg, 
        SUM(valor) AS compra_catalisador
    FROM dados
    ${lote ? 'WHERE lote = ?' : '1=1'}
    GROUP BY representante
) AS dados_soma ON r.nome = dados_soma.nome
LEFT JOIN (
    SELECT 
        r.nome AS representante,
        COALESCE(SUM(rf2.saldo), 0) AS saldo_adiantamentos
    FROM 
        representantes r
    LEFT JOIN (
        SELECT 
            CASE 
                WHEN associado IS NOT NULL THEN associado 
                ELSE representante_id 
            END AS id,
            COALESCE(SUM(valor_debito - valor_credito), 0) AS saldo
        FROM 
            registros_financeiros
        GROUP BY 
            CASE 
                WHEN associado IS NOT NULL THEN associado 
                ELSE representante_id 
            END
    ) AS rf2 ON r.id = rf2.id
    GROUP BY 
        r.nome
) AS adiantamentos_soma ON r.nome = adiantamentos_soma.representante
LEFT JOIN (
    SELECT 
        p.representante_id, 
        SUM(p.valor) AS valor_total_pecas
    FROM 
        pecas p
    GROUP BY 
        p.representante_id
) AS pecas_soma ON r.id = pecas_soma.representante_id
GROUP BY
    r.nome,
    dados_soma.total_kg,
    pecas_soma.valor_total_pecas,
    dados_soma.compra_catalisador,
    adiantamentos_soma.saldo_adiantamentos
ORDER BY
    r.nome;




    `;

    const params = [];
    if (lote) {
        params.push(lote);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar saldos:', err);
            res.status(500).send('Erro ao buscar saldos');
            return;
        }

        // Ajusta o resultado para que Saldo Adiantamentos sempre seja '-'
        const adjustedResults = results.map(item => ({
            ...item,
            saldo_adiantamentos: item.saldo_adiantamentos > 0 ? item.saldo_adiantamentos : '-', // Define o valor de Saldo Adiantamentos como '-' se for zero
        }));

        res.json(adjustedResults);
    });
});

// Rota para obter o associado baseado no representante_id
app.get('/api/associado/:representanteId', (req, res) => {
    const representanteId = req.params.representanteId;

    const query = `
        SELECT associado
        FROM representantes_financeiros
        WHERE id = ?
    `;

    db.query(query, [representanteId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar associado:', err);
            return res.status(500).json({ message: 'Erro ao buscar associado', error: err });
        }

        if (results.length > 0) {
            const associado = results[0].associado;
            res.json({ associado }); // Retorna o associado
        } else {
            res.status(404).json({ message: 'Representante não encontrado' });
        }
    });
});

app.get('/api/registros_financeiros_por_data', (req, res) => {
    const dataSelecionada = req.query.data;

    const query = `
       SELECT rf.id, rf.data, rf.hora, r.nome AS representante, COALESCE(c.nome, rf.comprador) AS comprador, 
           rf.valor_debito, rf.valor_credito, rf.pagamento, rf.observacoes
    FROM registros_financeiros rf
    LEFT JOIN compradores c ON rf.comprador = c.id
    LEFT JOIN representantes_financeiros r ON rf.representante_id = r.id
    WHERE rf.data = ?
    `;

    db.query(query, [dataSelecionada], (error, results) => {
        if (error) {
            console.error('Erro ao buscar registros financeiros:', error);
            return res.status(500).json({ error: 'Erro ao buscar registros financeiros' });
        }
        console.log('Dados retornados:', results); // Adicione este log
        res.json(results);
    });
});

// Endpoint para buscar o ID do representante pelo nome
app.get('/api/representante-id', (req, res) => {
    const nome = req.query.nome;

    if (!nome) {
        return res.status(400).send('Parâmetro nome é obrigatório.');
    }

    const query = 'SELECT id FROM representantes WHERE nome = ?';
    db.query(query, [nome], (err, results) => {
        if (err) {
            console.error('Erro ao buscar o ID do representante:', err);
            return res.status(500).send('Erro ao buscar o ID do representante.');
        }

        if (results.length === 0) {
            return res.status(404).send('Representante não encontrado.');
        }

        res.json({ id: results[0].id });
    });
});

// Endpoint para buscar um PDF específico com base no representante e lote
app.get('/api/pdf', (req, res) => {
    const representante_id = req.query.representante_id;
    const lote_id = req.query.lote_id;
    const npdf = req.query.npdf;

    if (!representante_id || !lote_id || !npdf) {
        return res.status(400).send('Parâmetros necessários não fornecidos.');
    }

    const query = `
        SELECT data
        FROM pdfs
        WHERE representante_id = ? AND lote = ? AND Npdf = ?
    `;
    
    db.query(query, [representante_id, lote_id, npdf], (err, results) => {
        if (err) {
            console.error('Erro ao buscar o PDF:', err);
            return res.status(500).send('Erro ao buscar o PDF.');
        }

        if (results.length === 0) {
            return res.status(404).send('PDF não encontrado.');
        }

        res.contentType('application/pdf');
        res.send(results[0].data);
    });
});

app.put('/api/compradores/:id', (req, res) => {
    const compradorId = req.params.id;
    const { nome, cpf_cnpj } = req.body;

    // Certifique-se de remover qualquer formatação antes de salvar
    const cpfCnpjLimpo = cpf_cnpj.replace(/[^\d]+/g, '');

    db.query('UPDATE compradores SET nome = ?, cpf_cnpj = ? WHERE id = ?', [nome, cpfCnpjLimpo, compradorId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao atualizar o comprador' });
        }
        res.json({ success: true });
    });
});


app.delete('/api/compradores/:id', (req, res) => {
    const compradorId = req.params.id;

    // Exclua o comprador do banco de dados
    db.query('DELETE FROM compradores WHERE id = ?', [compradorId], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Erro ao excluir o comprador' });
        }
        res.json({ success: true });
    });
});


app.get('/pecaspdf', (req, res) => {
    const npeca = req.query.npeca; // Captura o npeca da query
    const representanteId = req.query.representante_id;
    const loteId = req.query.lote_id;

    let query = 'SELECT id, nome_pdf, data FROM pecaspdf WHERE 1=1';
    let params = [];

    // Filtros opcionais
    if (representanteId) {
        query += ' AND representante_id = ?';
        params.push(representanteId);
    }

    if (loteId) {
        query += ' AND lote = ?';
        params.push(loteId);
    }

    if (npeca) {
        query += ' AND npeca = ?'; // Filtro por npeca
        params.push(npeca);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar PDFs:', err);
            return res.status(500).send('Erro ao buscar PDFs.');
        }

        // Se `npeca` estiver presente, significa que o usuário está solicitando o PDF específico
        if (npeca) {
            if (results.length > 0) {
                const pdfData = results[0].data; // Assume que os dados do PDF estão no campo `data`

                if (!pdfData || !Buffer.isBuffer(pdfData)) {
                    return res.status(404).send('PDF não encontrado.');
                }

                // Configura os cabeçalhos para o PDF
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `inline; filename="${results[0].nome_pdf}"`);
                res.send(pdfData); // Envia os dados do PDF
            } else {
                res.status(404).send('Nenhum PDF encontrado para os critérios fornecidos.');
            }
        } else {
            // Caso contrário, retorna apenas os metadados
            const metadados = results.map(row => ({
                id: row.id,
                nome_pdf: row.nome_pdf
            }));
            res.json(metadados);
        }
    });
});

app.post('/upload/files', upload.fields([
    { name: 'pdfpecas', maxCount: 200 },
    { name: 'photopecas', maxCount: 10 }
]), (req, res) => {
    const { representanteId, npeca, lote } = req.body;
    const pdfFiles = req.files['pdfpecas'] || [];
    const photoFiles = req.files['photopecas'] || [];

    // Verificar se há arquivos
    if (pdfFiles.length === 0 && photoFiles.length === 0) {
        return res.status(400).send('Nenhum arquivo enviado.');
    }

    // Função para salvar arquivos PDF
    const savePDF = (file) => {
        const nome_pdf = file.originalname;
        const data = file.buffer;

        const query = `
            INSERT INTO pecaspdf (nome_pdf, data, representante_id, npeca, lote)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(query, [nome_pdf, data, representanteId, npeca, lote], (err) => {
            if (err) {
                console.error('Erro ao salvar PDF:', err);
            }
        });
    };

    // Função para salvar fotos
    const savePhoto = (file) => {
        const nome_foto = file.originalname;
        const data = file.buffer;

        const query = `
            INSERT INTO pecasfoto (nome_foto, data, representante_id, npeca, lote)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(query, [nome_foto, data, representanteId, npeca, lote], (err) => {
            if (err) {
                console.error('Erro ao salvar foto:', err);
            }
        });
    };

    // Salvar todos os arquivos PDF
    pdfFiles.forEach(savePDF);
    // Salvar todos os arquivos de foto
    photoFiles.forEach(savePhoto);

    res.status(201).send('Arquivos salvos com sucesso!');
});


// Rota para exibir o PDF
app.get('/pecaspdf/:id', (req, res) => {
    const pdfId = req.params.id;
    const query = 'SELECT nome_pdf, data FROM pecaspdf WHERE id = ?';

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

// Rota para exibir a lista de PDFs com links para visualização
app.get('/pecaspdf', (req, res) => {
    const representanteId = req.query.representante_id;
    const loteId = req.query.lote;

    let query = 'SELECT nome_pdf, data FROM pecaspdf WHERE 1=1';
    let params = [];

    if (representanteId) {
        query += ' AND representante_id = ?';
        params.push(representanteId);
    }

    if (loteId) {
        query += ' AND lote = ?';
        params.push(loteId);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar PDFs:', err);
            return res.status(500).send('Erro ao buscar PDFs.');
        }

        // Verifica se existem resultados
        if (results.length > 0) {
            const pdfData = results[0].data; // assume que os dados do PDF estão no campo `data`

            if (!pdfData || !Buffer.isBuffer(pdfData)) {
                return res.status(404).send('PDF não encontrado.');
            }

            // Configura os cabeçalhos para o PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `inline; filename="${results[0].nome_pdf}"`);
            res.send(pdfData); // Envia os dados do PDF
        } else {
            res.status(404).send('Nenhum PDF encontrado para os critérios fornecidos.');
        }
    });
});


app.put('/pecaspdf/:id', (req, res) => {
    const pdfId = req.params.id;
    const novoNome = req.body.novoNome;
    const query = 'UPDATE pecaspdf SET nome_pdf = ? WHERE id = ?';

    db.query(query, [novoNome, pdfId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao renomear o arquivo no banco de dados.');
        }

        res.send('Nome do PDF atualizado com sucesso.');
    });
});
app.delete('/pecaspdf/:id', (req, res) => {
    const pdfId = req.params.id;
    const query = 'DELETE FROM pecaspdf WHERE id = ?';

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
app.get('/download-pecaspdf', async (req, res) => {
    const representanteIds = req.query.representante_ids ? req.query.representante_ids.split(',') : [];
    const lote = req.query.lote;
    const option = req.query.option;

    // Construção da query SQL com ordenação por nome do representante
    let queryStr = `
        SELECT p.nome_pdf, p.data, r.nome AS representante_nome 
        FROM pecaspdf p
        JOIN representantes r ON p.representante_id = r.id
        WHERE 1=1
    `;
    let queryParams = [];

    // Filtro por representantes
    if (representanteIds.length > 0) {
        queryStr += ' AND p.representante_id IN (?)';
        queryParams.push(representanteIds);
    }

    // Filtro por lote
    if (lote) {
        queryStr += ' AND p.lote = ?';
        queryParams.push(lote);
    }

    // Ordenar os PDFs pelo nome do representante
    queryStr += ' ORDER BY r.nome ASC';

    try {
        // Executa a query para buscar os PDFs
        const pdfs = await promisify(db.query).bind(db)(queryStr, queryParams);

        if (option === 'unify') {
            const mergedPdf = await PDFDocument.create();

            for (const pdf of pdfs) {
                if (pdf.data && pdf.data.toString('utf-8').startsWith('%PDF-')) {
                    const pdfDoc = await PDFDocument.load(pdf.data);
                    const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
                    copiedPages.forEach((page) => mergedPdf.addPage(page));
                } else {
                    console.error(`Arquivo inválido ou corrompido: ${pdf.name}`);
                }
            }

            const mergedPdfBytes = await mergedPdf.save();

            res.setHeader('Content-Disposition', 'attachment; filename="unified_pdfs.pdf"');
            res.setHeader('Content-Type', 'application/pdf');
            res.send(Buffer.from(mergedPdfBytes));
        } else {
            const zip = new JSZip();
            const zipFolder = zip.folder('pdfs');

            for (const pdf of pdfs) {
                if (pdf.data) {
                    let buffer = Buffer.isBuffer(pdf.data) ? pdf.data : Buffer.from(pdf.data, 'binary');
                    zipFolder.file(pdf.name, buffer);
                }
            }

            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

            res.setHeader('Content-Disposition', 'attachment; filename="pdfs.zip"');
            res.setHeader('Content-Type', 'application/zip');
            res.send(zipBuffer);
        }
    } catch (error) {
        console.error('Erro ao buscar PDFs:', error);
        res.status(500).send('Erro ao buscar PDFs do banco de dados.');
    }
});

app.get('/pecasfoto', (req, res) => {
    const representanteId = req.query.representante_id;
    const loteId = req.query.lote_id;

    let query = 'SELECT * FROM pecasfoto WHERE 1=1';
    let params = [];

    if (representanteId) {
        query += ' AND representante_id = ?';
        params.push(representanteId);
    }

    if (loteId) {
        query += ' AND lote = ?';
        params.push(loteId);
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Erro ao buscar Fotos:', err);
            return res.status(500).send('Erro ao buscar Fotos.');
        }
        res.json(results);
    });
});

app.get('/pecasfoto/:id', (req, res) => {
    const photosId = req.params.id;
    const query = 'SELECT nome_foto, data FROM pecasfoto WHERE id = ?';

    db.query(query, [photosId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao buscar o arquivo no banco de dados.');
        }

        if (results.length === 0) {
            return res.status(404).send('Arquivo não encontrado.');
        }

        const photos = results[0];

        // Configura o cabeçalho para exibir o PDF diretamente no navegador
        res.setHeader('Content-Type', 'application/pecasfoto');
        res.setHeader('Content-Disposition', 'inline; filename="' + photos.nome_foto + '"');

        // Envia o PDF para exibição no navegador
        res.send(photos.data);
    });
});

// Endpoint para renomear uma foto
app.put('/pecasfoto/:id', (req, res) => {
    const photosId = req.params.id;
    const novoNome = req.body.novoNome;
    const query = 'UPDATE pecasfoto SET nome_foto = ? WHERE id = ?';

    db.query(query, [novoNome, photosId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao renomear o arquivo no banco de dados.');
        }

        res.send('Nome da FOTO atualizado com sucesso.');
    });
});

// Endpoint para deletar uma foto
app.delete('/pecasfoto/:id', (req, res) => {
    const fotoId = req.params.id;
    const query = 'DELETE FROM pecasfoto WHERE id = ?';

    db.query(query, [fotoId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Erro ao deletar o arquivo no banco de dados.');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('FOTO não encontrado.');
        }

        res.send('FOTO deletado com sucesso.');
    });
});

app.post('/cadastrarUsuario', (req, res) => {
    const { username, password, access_level } = req.body;

    // Verificar se os campos estão preenchidos
    if (!username || !password || !access_level) {
        console.log('Campos não preenchidos:', { username, password, access_level });
        return res.status(400).json({ success: false, message: 'Preencha todos os campos.' });
    }

    // Verificar se o nome de usuário já existe
    const queryCheck = 'SELECT * FROM users WHERE username = ?';
    db.query(queryCheck, [username], (err, results) => {
        if (err) {
            console.error('Erro ao verificar nome de usuário:', err);
            return res.status(500).json({ success: false, message: 'Erro ao verificar nome de usuário.' });
        }

        if (results.length > 0) {
            console.log('Nome de usuário já existe:', username);
            return res.status(400).json({ success: false, message: 'Nome de usuário já existe.' });
        }

        const saltRounds = 10; // Ajuste conforme necessário

        // Criptografar a senha
        bcrypt.hash(password, saltRounds, (err, hash) => {
            if (err) {
                console.error('Erro ao criptografar a senha:', err);
                return res.status(500).json({ success: false, message: 'Erro ao criptografar a senha.' });
            }

            // Inserir o novo usuário no banco de dados
            const queryInsert = 'INSERT INTO users (username, password, access_level) VALUES (?, ?, ?)';
            db.query(queryInsert, [username, hash, access_level], (err, results) => {
                if (err) {
                    console.error('Erro ao cadastrar usuário:', err);
                    return res.status(500).json({ success: false, message: 'Erro ao cadastrar usuário.' });
                }

                res.status(200).json({ success: true, message: 'Usuário cadastrado com sucesso.' });
            });
        });
    });
});
app.get('/api/pecas', (req, res) => {
    const representanteId = req.query.representante;
    const lote = req.query.lote;

    // Verifica se os parâmetros estão presentes
    if (!representanteId || !lote) {
        return res.status(400).json({ error: 'Parâmetros faltando.' });
    }

    // Exemplo de consulta para buscar peças
    const query = 'SELECT npeca FROM pecas WHERE representante_id = ? AND lote = ?';
    db.query(query, [representanteId, lote], (err, results) => {
        if (err) {
            console.error('Erro ao buscar Npecas:', err);
            return res.status(500).json({ error: 'Erro no servidor ao buscar Npecas.' });
        }
        
        // Verifica se não há resultados
        if (results.length === 0) {
            return res.status(404).json({ error: 'Nenhuma peça encontrada.' });
        }

        // Retorna os resultados no formato desejado
        res.json(results.map(row => ({ npeca: row.npeca })));
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

function verificarNivelAcesso(nivelPermitido) {
    return (req, res, next) => {
        // Verifique se o usuário está autenticado
        if (!req.session.user) {
            return res.status(401).send('Usuário não autenticado.');
        }

        // Extraia o nível de acesso do usuário da sessão
        const { access_level } = req.session.user;

        // Verifique se o nível de acesso do usuário é permitido
        if (access_level === nivelPermitido || access_level === 'admin') {
            next(); // Usuário tem permissão
        } else {
            res.status(403).send('Acesso negado.'); // Negar acesso se não autorizado
        }
    };
}

// Endpoint para definir o lote padrão
app.post('/api/setLotePadrao', (req, res) => {
    const { lotePadrao } = req.body;
    console.log("Lote Padrão Recebido:", lotePadrao); // Verifique se está recebendo o lote corretamente

    const query = 'INSERT INTO configuracoes (lote_padrao) VALUES (?) ON DUPLICATE KEY UPDATE lote_padrao = ?';
    db.query(query, [lotePadrao, lotePadrao], (error, results) => {
        if (error) {
            console.error('Erro ao salvar lote padrão:', error);
            return res.status(500).send('Erro ao salvar lote padrão.');
        }
        // Retorne o lote padrão salvo
        res.status(200).json({ message: 'Lote padrão salvo com sucesso!', lote_padrao: lotePadrao });
    });
});





// Endpoint para buscar o lote padrão
app.get('/api/lotePadrao', (req, res) => {
    const query = 'SELECT lote_padrao FROM configuracoes LIMIT 1';
    db.query(query, (error, results) => {
        if (error) {
            console.error('Erro ao buscar lote padrão:', error);
            return res.status(500).send('Erro ao buscar lote padrão.');
        }
        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(404).send('Lote padrão não encontrado.');
        }
    });
});
