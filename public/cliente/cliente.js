document.addEventListener('DOMContentLoaded', function () {
    const editRepresentanteSelect = document.getElementById('editRepresentante');

    // Carregar representantes do banco de dados
    fetch('/api/representantes')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar representantes: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            const representanteSelect = document.getElementById('representante');
            data.forEach(representante => {
                const option = document.createElement('option');
                option.value = representante.id; // O valor é o ID
                option.textContent = representante.nome; // O texto é o nome
                representanteSelect.appendChild(option);

                const editOption = document.createElement('option');
                editOption.value = representante.id; // O valor é o ID
                editOption.textContent = representante.nome; // O texto é o nome
                editRepresentanteSelect.appendChild(editOption);
            });
        })
        .catch(error => console.error('Erro ao carregar representantes:', error));

    document.getElementById('clientForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const nome = document.getElementById('fornecedorNome').value;
        const cpf = document.getElementById('fornecedorCpf').value.replace(/\D/g, ''); // Remove caracteres não numéricos

        // Obtenha o ID do representante
        const representanteId = document.getElementById('representante').value;

        // Obtenha o nome do representante correspondente ao ID
        const representanteNome = document.querySelector(`#representante option[value="${representanteId}"]`).textContent;

        // Agora use representanteNome em vez de representanteId ao enviar os dados
        fetch(`/api/cooperados/check-cpf/${cpf}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao verificar CPF');
                }
                return response.json();
            })
            .then(data => {
                if (data.exists) {
                    alert('CPF já cadastrado. Por favor, verifique os dados.');
                } else {
                    fetch('/api/cooperados', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ nome, cpf, representanteNome }) // Envie o nome do representante
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Cliente cadastrado com sucesso!');
                            document.getElementById('clientForm').reset();
                            carregarCooperados();
                        } else {
                            alert('Erro ao cadastrar cliente!');
                        }
                    })
                    .catch(error => console.error('Erro ao cadastrar cliente:', error));
                }
            })
            .catch(error => {
                console.error('Erro ao verificar CPF:', error);
                alert('Erro ao verificar CPF. Tente novamente mais tarde.');
            });
    });
});




// Função para carregar fornecedores e representantes
function carregarFornecedores() {
    fetch('/api/fornecedores')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar fornecedores: ' + response.statusText);
            }
            return response.json();
        })
        .then(fornecedores => {
            if (!Array.isArray(fornecedores)) {
                throw new Error('Os dados recebidos não são um array');
            }

            const fornecedoresTableBody = document.getElementById('fornecedoresTableBody');
            fornecedoresTableBody.innerHTML = ''; // Limpa o corpo da tabela antes de adicionar novas linhas

            // Objeto para rastrear nomes exibidos
            const nomesExibidos = new Set();

            // Constrói as linhas da tabela com os dados dos fornecedores e representantes
            fornecedores.forEach(item => {
                const nomeReduzido = gerarNomeReduzido(item.fornecedor);

                // Verifica se o nome já foi exibido
                if (!nomesExibidos.has(nomeReduzido)) {
                    nomesExibidos.add(nomeReduzido); // Adiciona o nome ao conjunto
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${gerarNomeReduzido(item.fornecedor)}</td>
                        <td>
                            <input type="text" value="${item.cpf}" class="form-control" id="cpf-${item.id}" disabled>
                        </td>
                          <td>${gerarNomeReduzido(item.fornecedor)}</td>
                        <td>
                            <input type="text" value="${item.fornecedor}" class="form-control" id="fornecedor-${item.id}" disabled>
                        </td>
                        <td>${item.representante_id}</td>                              
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="toggleEdit(${item.id}, this)">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="excluirFornecedor(${item.id})">Excluir</button>
                        </td>
                    `;
                     // Adiciona o evento de input para formatar o CPF em tempo real
                     const cpfInput = row.querySelector(`#cpf-${item.id}`);
                     cpfInput.addEventListener('input', function() {
                         formatarCPF(cpfInput);
                     });

                    fornecedoresTableBody.appendChild(row);
                }
            });
            document.getElementById('fornecedoresContainer').style.display = 'block'; // Mostra o contêiner
        })
        .catch(error => console.error('Erro:', error));
}
// Função para alternar entre editar e salvar
function toggleEdit(id, button) {
    const cpfInput = document.getElementById(`cpf-${id}`);
    const fornecedorInput = document.getElementById(`fornecedor-${id}`);

    if (cpfInput.disabled) {
        // Habilita os inputs e muda o texto do botão
        cpfInput.disabled = false;
        fornecedorInput.disabled = false;
        button.textContent = 'Salvar';
    } else {
        // Formata o CPF antes de salvar
        formatarCPF(cpfInput); // Chama a função de formatação

        // Desabilita os inputs e salva os dados
        const novoCpf = cpfInput.value;
        const novoFornecedor = fornecedorInput.value;

        // Atualiza os dados no servidor
        atualizarFornecedor(id, novoCpf, novoFornecedor)
            .then(() => {
                cpfInput.disabled = true;
                fornecedorInput.disabled = true;
                button.textContent = 'Editar';
                carregarFornecedores(); // Recarrega a lista de fornecedores para refletir as alterações
            })
            .catch(error => console.error('Erro ao atualizar fornecedor:', error));
    }
}


// Função para enviar a requisição de atualização
function atualizarFornecedor(id, cpf, fornecedor) {
    return fetch(`/api/fornecedores/${id}`, {
        method: 'PUT', // Método de atualização
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cpf, fornecedor }),
    }).then(response => {
        if (!response.ok) {
            throw new Error('Erro ao atualizar fornecedor: ' + response.statusText);
        }
    });
}

// Função para gerar o nome reduzido
function gerarNomeReduzido(nomeCompleto) {
    const partes = nomeCompleto.split(' ');
    if (partes.length < 2) return nomeCompleto; // Retorna o nome completo se não houver sobrenome

    const primeiroNome = partes[0];
    const sobrenome = partes[1].charAt(0); // Primeira letra do sobrenome
    return `${primeiroNome} ${sobrenome.toUpperCase()}c`; // Adiciona 'c' ao final
}

function carregarRepresentantes() {
    fetch('/api/fornecedores')
        .then(response => response.json())
        .then(data => {
            const representanteSelect = document.getElementById('representanteSelect');
            representanteSelect.innerHTML = ''; // Limpa o dropdown antes de adicionar novas opções
            
            // Adiciona a opção "Todos"
            const optionTodos = document.createElement('option');
            optionTodos.value = ''; // Deixe vazio para representar "Todos"
            optionTodos.textContent = 'Todos';
            representanteSelect.appendChild(optionTodos);

            // Adiciona opções dos representantes
            const representantes = new Set(data.map(item => item.representante_id));
            representantes.forEach(id => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = `${id}`; // Altere conforme necessário para mostrar o nome do representante
                representanteSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar representantes:', error));
}
// Chame esta função quando a página carregar
document.addEventListener('DOMContentLoaded', carregarRepresentantes);
function formatarCPF(input) {
    // Remove todos os caracteres que não são números
    const valor = input.value.replace(/\D/g, '');

    // Aplica a máscara de CPF
    let cpfFormatado = valor;
    if (valor.length > 3 && valor.length <= 6) {
        cpfFormatado = valor.replace(/(\d{3})(\d+)/, '$1.$2');
    } else if (valor.length > 6 && valor.length <= 9) {
        cpfFormatado = valor.replace(/(\d{3})(\d{3})(\d+)/, '$1.$2.$3');
    } else if (valor.length > 9) {
        cpfFormatado = valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    // Limita o tamanho do CPF formatado a 14 caracteres
    if (cpfFormatado.length > 14) {
        cpfFormatado = cpfFormatado.slice(0, 14);
    }

    // Atualiza o valor do input com o CPF formatado
    input.value = cpfFormatado;
}

// Chama a função para carregar fornecedores ao iniciar a página
document.addEventListener('DOMContentLoaded', carregarFornecedores);

function filtrarFornecedores() {
    const nomeFiltro = document.getElementById('searchNome').value.toLowerCase();
    const cpfFiltro = document.getElementById('searchCPF').value.replace(/\D/g, ''); // Remove caracteres não numéricos
    const representanteFiltro = document.getElementById('representanteSelect').value;

    const fornecedoresTableBody = document.getElementById('fornecedoresTableBody');
    const rows = fornecedoresTableBody.getElementsByTagName('tr');

    // Filtra cada linha da tabela
    Array.from(rows).forEach(row => {
        const nomeFornecedor = row.cells[0].textContent.toLowerCase();
        const cpfFornecedor = row.cells[1].textContent.replace(/\D/g, ''); // Remove caracteres não numéricos do CPF
        const representanteFornecedor = row.cells[4].textContent; // ID do representante na coluna 4

        const nomeMatch = nomeFornecedor.includes(nomeFiltro);
        const cpfMatch = cpfFornecedor.includes(cpfFiltro);
        const representanteMatch = representanteFiltro === '' || representanteFornecedor === representanteFiltro;

        // Mostra ou oculta a linha com base nos critérios de pesquisa
        if (nomeMatch && cpfMatch && representanteMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function excluirFornecedor(id) {
    // Confirmação antes de excluir
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
        // Faz a requisição para excluir o fornecedor
        fetch(`/api/fornecedores/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao excluir fornecedor: ' + response.statusText);
            }
            // Recarrega a lista de fornecedores após a exclusão
            carregarFornecedores();
        })
        .catch(error => console.error('Erro:', error));
    }
}



document.getElementById('exportButton').addEventListener('click', exportarParaExcel);

function exportarParaExcel() {
    const fornecedoresTable = document.getElementById('fornecedoresTableBody');
    const data = [];

    // Adiciona os cabeçalhos da tabela
    const headers = ['Codinome', 'CPF', 'Apelido', 'Nome Completo', 'Representante', '', 'Comprador', '1ª Comissionado', 'Fórmula', '2ª Comissionado', 'Fórmula', '3ª Comissionado', 'Fórmula'];
    data.push(headers);

    // Adiciona as linhas da tabela
    fornecedoresTable.querySelectorAll('tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach((cell, index) => {
            if (index < 5) { // Ignora a coluna de ações (última coluna)
                rowData.push(cell.innerText);
            }
        });
        // Preenche as colunas adicionais com os valores solicitados
        const codinome = rowData[0];
        const representante = rowData[4];
        rowData.push('');
        rowData.push(codinome);
        rowData.push(codinome);
        rowData.push('0,9');
        rowData.push(representante);
        rowData.push('0,1');
        rowData.push('CYCLEREUSE');
        rowData.push('0,1');
        data.push(rowData);
    });

    // Cria uma nova planilha
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Estilizando o cabeçalho
    const headerCellRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = headerCellRange.s.c; col <= headerCellRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ c: col, r: 0 }); // Célula do cabeçalho
        if (!worksheet[cellAddress]) {
            worksheet[cellAddress] = {}; // Cria a célula se não existir
        }
        worksheet[cellAddress].s = {
            fill: {
                fgColor: { rgb: "333333" } // Cor de fundo cinza escuro
            },
            font: {
                color: { rgb: "FFFFFF" }, // Cor do texto branco
                bold: true // Texto em negrito
            }
        };
    }

    // Ajusta a largura das colunas
    worksheet['!cols'] = [
        { wch: 15 }, // Codinome
        { wch: 15 }, // CPF
        { wch: 15 }, // Apelido
        { wch: 25 }, // Nome Completo
        { wch: 20 }, // Representante
        { wch: 5 },  // Coluna vazia
        { wch: 15 }, // Comprador
        { wch: 25 }, // 1ª Comissionado
        { wch: 15 }, // Fórmula
        { wch: 25 }, // 2ª Comissionado
        { wch: 15 }, // Fórmula
        { wch: 25 }, // 3ª Comissionado
        { wch: 15 }  // Fórmula
    ];

    // Cria um novo livro de trabalho e adiciona a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fornecedores');

    // Exporta o arquivo Excel
    XLSX.writeFile(workbook, 'fornecedores.xlsx');
}

