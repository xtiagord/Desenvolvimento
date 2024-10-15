document.addEventListener('DOMContentLoaded', function() {
    const editRepresentanteSelect = document.getElementById('editRepresentante');

    // Carregar representantes do banco de dados
fetch('/api/representantes')
.then(response => response.json())
.then(data => {
    const representanteSelect = document.getElementById('representante');
    data.forEach(representante => {
        const option = document.createElement('option');
        option.value = representante.id;
        option.textContent = representante.nome;
        representanteSelect.appendChild(option);

        const editOption = document.createElement('option');
        editOption.value = representante.id;
        editOption.textContent = representante.nome;
        editRepresentanteSelect.appendChild(editOption);
    });
})
.catch(error => console.error('Erro ao carregar representantes:', error));

// Enviar dados do formulário para o backend
document.getElementById('clientForm').addEventListener('submit', function(event) {
event.preventDefault();
const nome = document.getElementById('nome').value;
const cpf = document.getElementById('cpf').value;
const representanteId = document.getElementById('representante').value;

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
                body: JSON.stringify({ nome, cpf, representanteId })
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
                const cpfFormatado = formatarCPF(item.cpf); // Formata o CPF

                // Verifica se o nome já foi exibido
                if (!nomesExibidos.has(nomeReduzido)) {
                    nomesExibidos.add(nomeReduzido); // Adiciona o nome ao conjunto
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${nomeReduzido}</td> 
                        <td>${cpfFormatado}</td>
                        <td>${nomeReduzido}</td> 
                        <td>${item.fornecedor}</td>
                        <td>${item.representante}</td>                                   
                        <td>
                            <button class="btn btn-primary btn-sm" onclick="editarFornecedor(${item.id})">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="excluirFornecedor(${item.id})">Excluir</button>
                        </td>
                    `;
                    fornecedoresTableBody.appendChild(row);
                }
                // Se o nome já foi exibido, não faz nada
            });

            document.getElementById('fornecedoresContainer').style.display = 'block'; // Mostra o contêiner
        })
        .catch(error => console.error('Erro:', error));
}

// Função para gerar o nome reduzido
function gerarNomeReduzido(nomeCompleto) {
    const partes = nomeCompleto.split(' ');
    if (partes.length < 2) return nomeCompleto; // Retorna o nome completo se não houver sobrenome

    const primeiroNome = partes[0];
    const sobrenome = partes[1].charAt(0); // Primeira letra do sobrenome
    return `${primeiroNome} ${sobrenome.toUpperCase()}c`; // Adiciona 'c' ao final
}

// Função para formatar o CPF
function formatarCPF(cpf) {
    if (!cpf) return '000.000.000-00'; // Retorna CPF padrão se não houver CPF
    const cpfStr = cpf.toString().padStart(11, '0'); // Adiciona zeros à esquerda se necessário
    return `${cpfStr.slice(0, 3)}.${cpfStr.slice(3, 6)}.${cpfStr.slice(6, 9)}-${cpfStr.slice(9)}`; // Formata o CPF
}

// Chama a função para carregar fornecedores ao iniciar a página
document.addEventListener('DOMContentLoaded', carregarFornecedores);

document.getElementById('exportButton').addEventListener('click', exportarParaExcel);

function exportarParaExcel() {
    const fornecedoresTable = document.getElementById('fornecedoresTableBody');
    const data = [];
    
    // Adiciona os cabeçalhos da tabela
    const headers = ['Codinome', 'CPF', 'Apelido', 'Nome Completo', 'Representante'];
    data.push(headers);

    // Adiciona as linhas da tabela
    fornecedoresTable.querySelectorAll('tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach((cell, index) => {
            if (index < 5) { // Ignora a coluna de ações (última coluna)
                rowData.push(cell.innerText);
            }
        });
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
        { wch: 20 }  // Representante
    ];

    // Cria um novo livro de trabalho e adiciona a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fornecedores');

    // Exporta o arquivo Excel
    XLSX.writeFile(workbook, 'fornecedores.xlsx');
}




// Função para editar cooperado
window.editarCooperado = function(representanteId) {
fetch(`/api/cooperados/representante/${representanteId}`)
.then(response => {
    if (!response.ok) {
        throw new Error(`Erro ao carregar cooperado: ${response.status} - ${response.statusText}`);
    }
    return response.json();  // Parse JSON response
})
.then(cooperados => {
    if (cooperados.length === 0) {
        console.error('Nenhum cooperado encontrado para o representante fornecido');
        return;
    }
    const cooperado = cooperados[0];  // Vamos assumir que pegamos o primeiro cooperado encontrado
    console.log('Resposta da API:', cooperado);
    document.getElementById('editCooperadoId').value = cooperado.id;
    document.getElementById('editNome').value = cooperado.nome;
    document.getElementById('editCpf').value = cooperado.cpf;
    document.getElementById('editRepresentante').value = cooperado.representante_id;

    $('#editCooperadoModal').modal('show');
})
.catch(error => console.error('Erro ao carregar cooperado:', error));
};

// Função para salvar alterações no cooperado
document.getElementById('editCooperadoForm').addEventListener('submit', function(event) {
event.preventDefault();
const id = document.getElementById('editCooperadoId').value;
const nome = document.getElementById('editNome').value;
const cpf = document.getElementById('editCpf').value;
const representanteId = document.getElementById('editRepresentante').value;

fetch(`/api/cooperados/${id}`, {
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nome, cpf, representanteId })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        alert('Cliente atualizado com sucesso!');
        $('#editCooperadoModal').modal('hide');
        carregarCooperados();
    } else {
        alert('Erro ao atualizar cliente!');
    }
})
.catch(error => console.error('Erro:', error));
});

function excluirCooperado(cooperadoId) {
if (confirm('Tem certeza que deseja excluir este cooperado?')) {
fetch(`/api/cooperados/${cooperadoId}`, {
    method: 'DELETE'
})
.then(response => response.json())
.then(data => {
    carregarCooperados();
})
.catch(error => console.error('Erro ao excluir cooperado:', error));
}
}

document.addEventListener('DOMContentLoaded', () => {
fetch('/api/representantes')
.then(response => response.json())
.then(data => {
    const selectRepresentante = document.querySelector('#cooperadosContainer select');
    data.forEach(representante => {
        const option = document.createElement('option');
        option.value = representante.id;
        option.textContent = representante.nome;
        selectRepresentante.appendChild(option);
    });
})
.catch(error => console.error('Erro ao carregar representantes:', error));
});

document.querySelectorAll('#cooperadosContainer input, #cooperadosContainer select').forEach(input => {
input.addEventListener('input', filterCooperados);
});

function filterCooperados() {
const nome = document.querySelector('#cooperadosContainer input[placeholder="Nome"]').value.toLowerCase();
const cpf = document.querySelector('#cooperadosContainer input[placeholder="CPF"]').value.toLowerCase();
const representanteId = document.querySelector('#cooperadosContainer select').value;

fetch(`/api/cooperados?nome=${nome}&cpf=${cpf}&representante_id=${representanteId}`)
.then(response => response.json())
.then(data => {
    const tbody = document.querySelector('#cooperadosTableBody');
    tbody.innerHTML = '';

    data.forEach(cooperado => {
        const tr = document.createElement('tr');
        
        const tdNome = document.createElement('td');
        tdNome.textContent = cooperado.nome;
        tr.appendChild(tdNome);

        const tdCPF = document.createElement('td');
        tdCPF.textContent = cooperado.cpf;
        tr.appendChild(tdCPF);

        const tdRepresentante = document.createElement('td');
        tdRepresentante.textContent = cooperado.representante;
        tr.appendChild(tdRepresentante);

        const tdAcoes = document.createElement('td');
        // Adicione ações, como editar ou excluir
        tr.appendChild(tdAcoes);

        tbody.appendChild(tr);
    });
})
.catch(error => console.error('Erro ao carregar cooperados:', error));
}
