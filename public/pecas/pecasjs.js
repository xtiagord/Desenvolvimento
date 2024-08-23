document.getElementById('pdfForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const fileInput = document.getElementById('pdfFile');
    const file = fileInput.files[0];

    if (file) {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            extractPDFData(typedarray);
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        alert("Por favor, selecione um arquivo PDF.");
    }
});

async function extractPDFData(pdfData) {
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    const numPages = pdf.numPages;
    let extractedData = {
        modelo: [],
        codigo: [],
        quantidade: [],
        valor: []
    };

    let fullText = '';  // Variável para armazenar o texto completo extraído
    let textContent = ''; // Armazena o conteúdo textual completo para regex

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        content.items.forEach(item => {
            textContent += item.str.trim() + ' ';  // Adiciona o texto ao textContent
        });
    }

    // Exibe o texto completo extraído no console
    console.log('Texto completo extraído do PDF:', textContent);

    // Regex para encontrar o modelo e o código após o modelo
    const modeloRegex = /REUSO PÇ\s+([\w\s.]+?)(?:\s+\w{3,})? /;
    const codigoRegex = /REUSO PÇ\s+[\w\s.]+\s+(\w+) /;

    const modeloMatch = textContent.match(modeloRegex);
    const codigoMatch = textContent.match(codigoRegex);

    if (modeloMatch) {
        extractedData.modelo.push(modeloMatch[1].trim());
    }

    if (codigoMatch) {
        extractedData.codigo.push(codigoMatch[1].trim());
    }

    // Regex para capturar a quantidade e valor, se necessário
    const quantidadeRegex = /\d+,\d+\s+UN/;
    const valorRegex = /(?:\d{1,3}(?:\.\d{3})*,\d{2})(?!.*(?:\d{1,3}(?:\.\d{3})*,\d{2})(?= UN))   /gm;

    extractedData.quantidade = (textContent.match(quantidadeRegex) || []).map(q => q.trim());
    const valorMatches = textContent.match(valorRegex);
    if (valorMatches && valorMatches.length >= 2) {
        // Captura o segundo valor encontrado
        extractedData.valor.push(valorMatches[1].trim());
    }
    // Exibe os dados extraídos no console
    console.log('Dados extraídos:', extractedData);

    preencherInputs(extractedData);
}

function preencherInputs(data) {
    document.getElementById('modelo').value = data.modelo.join(', ');
    document.getElementById('codigo').value = data.codigo.join(', ');
    document.getElementById('quantidade').value = data.quantidade.join(', ');
    document.getElementById('valor').value = data.valor.join(', ');
}

