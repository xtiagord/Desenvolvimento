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
        alert("selecione um arquivo PDF.");
    }
});

function padArray(array, length) {
    while (array.length < length) {
        array.push('');
    }
    return array;
}

async function extractPDFData(pdfData) {
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const numPages = pdf.numPages;
    await populateRepresentantesSelect();

    let textContent = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        content.items.forEach(item => {
            textContent += item.str.trim() + ' ';
        });
    }

    console.log('Texto completo extraído do PDF:', textContent);

    const tipoModeloRegex = /(REUSO PÇ|CARCAÇA PÇ|FILTRO KG)\s+([\w\s.]+?)(?:\s+\w{3,})?  /g;
    const codigoRegex = /(REUSO PÇ|CARCAÇA PÇ|FILTRO KG)\s+[\w\s.]+\s+(\w+)  /g;
    const quantidadeRegex = /(\d+,\d+)\s+UN/g;
    const valorRegex = /(\d{1,3}(?:\.\d{3})*,\d{2})(?!.*(?:\d{1,3}(?:\.\d{3})*,\d{2})(?= UN))    /g;
    const clienteRegex = /Comprador\s+[A-Za-zÀ-ÖØ-öø-ÿ]+\s+([A-Za-zÀ-ÖØ-öø-ÿ]+\s+[A-Za-zÀ-ÖØ-öø-ÿ]+)/gm;

    let match;
    extractedData.tipo = [];
    extractedData.modelo = [];
    extractedData.codigo = [];
    extractedData.quantidade = [];
    extractedData.valor = [];
    extractedData.clientes = [];

    while ((match = tipoModeloRegex.exec(textContent)) !== null) {
        extractedData.tipo.push(match[1].trim());
        extractedData.modelo.push(match[2].trim());
    }

    while ((match = codigoRegex.exec(textContent)) !== null) {
        extractedData.codigo.push(match[2].trim());
    }

    extractedData.quantidade = (textContent.match(quantidadeRegex) || []).map(q => q.trim());
    extractedData.valor = (textContent.match(valorRegex) || []).map(v => v.trim());

    match = clienteRegex.exec(textContent);
    const clienteNome = match ? match[1].trim() : 'Não encontrado';
    extractedData.clientes = Array(extractedData.tipo.length).fill(clienteNome);

    if (extractedData.valor.length > 0) {
        extractedData.valor.pop();
    }

    const maxLength = Math.max(
        extractedData.tipo.length,
        extractedData.modelo.length,
        extractedData.codigo.length,
        extractedData.quantidade.length,
        extractedData.valor.length
    );

    extractedData.tipo = padArray(extractedData.tipo, maxLength);
    extractedData.modelo = padArray(extractedData.modelo, maxLength);
    extractedData.codigo = padArray(extractedData.codigo, maxLength);
    extractedData.quantidade = padArray(extractedData.quantidade, maxLength);
    extractedData.valor = padArray(extractedData.valor, maxLength);
    extractedData.clientes = padArray(extractedData.clientes, maxLength);

    console.log('Dados extraídos:', extractedData);

    preencherTabela(extractedData);
}

function preencherTabela(data) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = ''; // Limpa o conteúdo atual

    const maxRows = Math.max(data.tipo.length, data.modelo.length, data.codigo.length, data.quantidade.length, data.valor.length);

    let representativeSelects = []; // Armazena os seletores de representantes
    let loteSelects = []; // Armazena os seletores de lotes

    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement('tr');

        const cellTipo = document.createElement('td');
        const inputTipo = document.createElement('input');
        inputTipo.type = 'text';
        inputTipo.value = data.tipo[i] || '';
        inputTipo.addEventListener('input', () => {
            data.tipo[i] = inputTipo.value;
        });
        cellTipo.appendChild(inputTipo);

        const cellModelo = document.createElement('td');
        const inputModelo = document.createElement('input');
        inputModelo.type = 'text';
        inputModelo.value = data.modelo[i] || '';
        inputModelo.addEventListener('input', () => {
            data.modelo[i] = inputModelo.value;
        });
        cellModelo.appendChild(inputModelo);

        const cellCodigo = document.createElement('td');
        const inputCodigo = document.createElement('input');
        inputCodigo.type = 'text';
        inputCodigo.value = data.codigo[i] || '';
        inputCodigo.addEventListener('input', () => {
            data.codigo[i] = inputCodigo.value;
        });
        cellCodigo.appendChild(inputCodigo);

        const cellQuantidade = document.createElement('td');
        const inputQuantidade = document.createElement('input');
        inputQuantidade.type = 'text';
        inputQuantidade.value = data.quantidade[i] || '';
        inputQuantidade.addEventListener('input', () => {
            data.quantidade[i] = inputQuantidade.value;
        });
        cellQuantidade.appendChild(inputQuantidade);

        const cellValor = document.createElement('td');
        const inputValor = document.createElement('input');
        inputValor.type = 'text';
        inputValor.value = data.valor[i] || '';
        inputValor.addEventListener('input', () => {
            data.valor[i] = inputValor.value;
        });
        cellValor.appendChild(inputValor);

        const cellCliente = document.createElement('td');
        const inputCliente = document.createElement('input');
        inputCliente.type = 'text';
        inputCliente.value = data.clientes[i] || '';
        inputCliente.addEventListener('input', () => {
            data.clientes[i] = inputCliente.value;
        });
        cellCliente.appendChild(inputCliente);

        // Adiciona uma célula para o seletor de representante
        const cellRepresentante = document.createElement('td');
        const selectRepresentante = document.createElement('select');
        selectRepresentante.className = 'representante-select'; // Classe para selecionar representantes
        
        // Adiciona a opção padrão
        const defaultOptionRepresentante = document.createElement('option');
        defaultOptionRepresentante.value = ''; // Valor vazio para a opção padrão
        defaultOptionRepresentante.textContent = 'Escolha um representante';
        selectRepresentante.appendChild(defaultOptionRepresentante);

        // Adiciona as opções dos representantes
        selectRepresentante.innerHTML += document.getElementById('representante').innerHTML;
        
        selectRepresentante.value = data.representantes ? data.representantes[i] || '' : ''; // Preenche com o valor atual
        selectRepresentante.addEventListener('change', () => {
            const selectedValue = selectRepresentante.value;
            representativeSelects.forEach(s => s.value = selectedValue);
        });
        cellRepresentante.appendChild(selectRepresentante);

        // Adiciona uma célula para o seletor de lote
        const cellLote = document.createElement('td');
        const selectLote = document.createElement('select');
        selectLote.className = 'lote-select'; // Classe para selecionar lotes
        
        // Adiciona a opção padrão
        const defaultOptionLote = document.createElement('option');
        defaultOptionLote.value = ''; // Valor vazio para a opção padrão
        defaultOptionLote.textContent = 'Escolha um lote';
        selectLote.appendChild(defaultOptionLote);

        // Adiciona as opções dos lotes
        fetch('/api/lote')
            .then(response => response.json())
            .then(lotes => {
                lotes.forEach(lote => {
                    const option = document.createElement('option');
                    option.value = lote.nome;
                    option.textContent = lote.nome;
                    selectLote.appendChild(option);
                });
            })
            .catch(error => console.error('Erro ao carregar lotes:', error));
        
        selectLote.value = data.lotes ? data.lotes[i] || '' : ''; // Preenche com o valor atual
        selectLote.addEventListener('change', () => {
            const selectedValue = selectLote.value;
            loteSelects.forEach(s => s.value = selectedValue);
        });
        cellLote.appendChild(selectLote);

        row.appendChild(cellTipo);
        row.appendChild(cellModelo);
        row.appendChild(cellCodigo);
        row.appendChild(cellQuantidade);
        row.appendChild(cellValor);
        row.appendChild(cellCliente);
        row.appendChild(cellRepresentante);
        row.appendChild(cellLote);

        tableBody.appendChild(row);

        // Armazena os seletores para atualizar todos os seletores
        representativeSelects.push(selectRepresentante);
        loteSelects.push(selectLote);
    }
}


document.getElementById('save-data-btn').addEventListener('click', async function(event) {
    event.preventDefault();

    // Coleta dados dos representantes e lotes selecionados para cada linha
    const representativeSelects = document.querySelectorAll('.representante-select');
    const loteSelects = document.querySelectorAll('.lote-select');
    const representantesSelecionados = Array.from(representativeSelects).map(select => select.value);
    const lotesSelecionados = Array.from(loteSelects).map(select => select.value);

    if (representantesSelecionados.some(rep => rep === '') || lotesSelecionados.some(lote => lote === '')) {
        alert('Por favor, selecione um representante e um lote para todas as linhas.');
        return;
    }

    // Associa os representantes e lotes às linhas extraídas
    const dataToSave = {
        ...extractedData,
        representantes: representantesSelecionados,
        lotes: lotesSelecionados
    };

    try {
        const response = await fetch('/api/save-extracted-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSave)
        });

        if (response.ok) {
            alert('Dados salvos com sucesso!');
        } else {
            alert('Erro ao salvar os dados.');
        }
    } catch (error) {
        console.error('Erro ao enviar os dados:', error);
        alert('Erro ao salvar os dados.');
    }
});


let extractedData = {
    tipo: [],
    modelo: [],
    codigo: [],
    quantidade: [],
    valor: [],
    clientes: []
};

async function fetchRepresentantes() {
    try {
        const response = await fetch('/api/representantes');
        if (!response.ok) {
            throw new Error('Erro ao buscar representantes');
        }
        const representantes = await response.json();
        return representantes;
    } catch (error) {
        console.error(error);
        alert('Não foi possível carregar a lista de representantes.');
        return [];
    }
}

async function populateRepresentantesSelect() {
    const representantes = await fetchRepresentantes();
    const select = document.getElementById('representante');
    select.innerHTML = ''; // Limpa opções existentes

    representantes.forEach(rep => {
        const option = document.createElement('option');
        option.value = rep.id; // Supondo que você tenha um campo 'id'
        option.textContent = rep.nome; // Supondo que você tenha um campo 'nome'
        select.appendChild(option);
    });
}

