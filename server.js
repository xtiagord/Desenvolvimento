const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mysql = require('mysql');

// Inicializar o Express
const app = express();
const PORT = 3001;

// Configuração do MySQL
const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "sys",
});

// Configurar o middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configuração do Multer para upload de arquivos
const upload = multer({ dest: 'uploads/' }).fields([{ name: 'file', maxCount: 1 }, { name: 'pdfFile', maxCount: 1 }]);
const extractUpload = multer().single('pdf');

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
    const tableRegex = /(\d+,\d+)\s*(\d+,\d+)\s*(\d+,\d+)\s*(\d+,\d+)\s*(\d+,\d+)\s*(\d+,\d+)/g;
    const dataRegex = /Data\/Hora:\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/;
    const horaRegex = /Hora:\s*(\d{2}:\d{2})/i;
    const representanteRegex = /Representante\s+([A-Za-z\s]+)$/m;
    const fornecedorRegex = /Eu,\s+([A-Za-z\s]+),\s+portador/;

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
            data.hora = horaMatch[1];
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

    const insertQuery = 'INSERT INTO dados (Npdf, kg, pd, pt, rh, valorKg, valor, data, hora, representante, fornecedor, sn) VALUES ?';
    const values = data.map(row => [row.Npdf, row.kg, row.pd, row.pt, row.rh, row.valorKg, row.valor, row.data, row.hora, row.representante, row.fornecedor, row.sn]);

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

        const dateParts = date.split('/');
        if (dateParts.length !== 3) {
            return res.status(400).send('Invalid date format. Please use DD/MM/YYYY.');
        }

        const [day, month, year] = dateParts;
        const formattedDate = `${day}-${month}-${year}`;

        const mainFolderPath = path.join(directory, `ENTREGAS ${formattedDate}`);
        let specificFolderPath;
        if (mainFolder === '- PARAGUAI' || mainFolder === '- BOLIVIA') {
            specificFolderPath = path.join(mainFolderPath, mainFolder);
        } else {
            specificFolderPath = mainFolderPath;
        }

        const subFolderPath = mainFolder === 'ENTREGAS' ? path.join(specificFolderPath, subFolderName) : path.join(specificFolderPath, baseFolder, subFolderName);

        fs.mkdir(subFolderPath, { recursive: true }, (err) => {
            if (err) {
                return res.status(500).send('Error creating subfolder.');
            }

            if (req.files['file']) {
                const file = req.files['file'][0];
                const tempPath = file.path;
                const fileExt = path.extname(file.originalname);
                const targetPath = path.join(subFolderPath, newFileName + fileExt);

                fs.copyFile(tempPath, targetPath, (err) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Error copying the uploaded file.');
                    }

                    fs.unlink(tempPath, (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Error deleting the temporary file.');
                        }

                        updateFoldersInfo(subFolderPath);
                        res.send('Subfolder and file created successfully.');
                    });
                });
            } else {
                updateFoldersInfo(subFolderPath);
                res.send('Subfolder created successfully.');
            }
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

//arquivo index
app.get('/public/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Servir o arquivo arquivo.html
app.get('/public/arquivo.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'arquivo.html'));
});

app.get('/api/dados', (req, res) => {
    const sql = "SELECT * FROM dados";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Erro ao buscar dados:", err);
            return res.status(500).send("Erro ao buscar dados do banco de dados.");
        }
        res.json(results);
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
    const nomeRepresentante = req.params.nomeRepresentante;
    console.log('Nome do Representante:', nomeRepresentante); // Adicione este log

    const query = 'SELECT * FROM dados WHERE LOWER(representante) = ?';
    db.query(query, [nomeRepresentante], (err, results) => {
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
    const sql = 'SELECT * FROM cooperados';

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Erro ao buscar cooperados:', err);
            return res.status(500).json({ error: 'Erro ao buscar cooperados' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Nenhum cooperado encontrado' });
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

app.delete('/api/cooperados/:id', async (req, res) => {
    const cooperadoId = req.params.id;

    try {
        const sql = `
            DELETE FROM cooperados
            WHERE id = ?
        `;
        db.query(sql, [cooperadoId]);
        res.json({ success: true });
    } catch (err) {
        console.error('Erro ao excluir cooperado:', err);
        res.status(500).json({ error: 'Erro ao excluir cooperado' });
    }
});

app.put('/api/cooperados/:id', (req, res) => {
    const cooperadoId = req.params.id;
    const { nome, cpf, representanteId } = req.body;

    if (!nome || !cpf || !representanteId) {
        console.error('Dados incompletos:', { nome, cpf, representanteId });
        return res.status(400).json({ error: 'Nome, CPF e Representante são obrigatórios.' });
    }

    const sql = 'UPDATE cooperados SET nome = ?, cpf = ?, representante_id = ? WHERE id = ?';
    db.query(sql, [nome, cpf, representanteId, cooperadoId], (err, results) => {
        if (err) {
            console.error('Erro ao atualizar cooperado:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ success: true });
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

  

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
