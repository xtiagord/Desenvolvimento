const express = require('express');
const fileUpload = require('express-fileupload');
const pdfParse = require('pdf-parse');
const path = require('path');

const app = express();
const PORT = 3002;

app.use(express.static('public'));
app.use(fileUpload());

function extractPDFData(text) {
    const tableRegex = /(\d+,\d+)\s*(\d+,\d+)\s*(\d+,\d+)\s*(\d+,\d+)\s*(\d+,\d+)\s*(\d+,\d+)/g;
    const dataRegex = /Data\/Hora:\s+(\d{2}\/\d{2}\/\d{4})\s+(\d{2}:\d{2})/;
    const horaRegex = /Hora:\s*(\d{2}:\d{2})/i;
    const representanteRegex = /Representante\s+([A-Za-z\s]+)$/m;
    const fornecedorRegex = /Eu,\s+([A-Za-z\s]+),\s+portador/;

    const tableData = [];
    let match;

    // Procurar por dados de tabela
    while ((match = tableRegex.exec(text)) !== null) {
        const data = {
            kh: match[1],
            pd: match[2],
            pt: match[3],
            rh: match[4],
            valorKg: match[5],
            valor: match[6]
        };

        // Procurar por dados adicionais
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

    console.log(tableData)

    return tableData;
}

app.post('/extract', async (req, res) => {
    if (!req.files || !req.files.pdf) {
        return res.status(400).send('No file uploaded.');
    }

    const pdfBuffer = req.files.pdf.data;

    try {
        const data = await pdfParse(pdfBuffer);
        const extractedData = extractPDFData(data.text);
        res.json(extractedData);
    } catch (error) {
        console.error("Erro ao processar o PDF:", error); // Log do erro
        res.status(500).send('Error processing PDF');
    }
});

app.get('/Extrator.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Extrator.html'));
});

app.listen(PORT, () => {
    console.log(`PDF extractor server is running on http://localhost:${PORT}`);
});
