$(document).ready(function() {
    $('#clientModal').on('show.bs.modal', function () {
        $.ajax({
            url: '/api/dados',
            method: 'GET',
            success: function(data) {
                console.log(data); // Verifique a estrutura dos dados recebidos

                const tableBody = $('#data-table-body');
                tableBody.empty(); // Limpar o corpo da tabela

                data.forEach(item => {
                    const row = `
                        <tr>
                            <td>${item.Npdf}</td>
                            <td>${item.kg}</td>
                            <td>${item.pd}</td>
                            <td>${item.pt}</td>
                            <td>${item.rh}</td>
                            <td>${item.valorkg}</td>
                            <td>${item.valor}</td>
                            <td>${item.data}</td>
                            <td>${item.hora}</td>
                            <td>${item.representante}</td> <!-- Exibir o nome do representante -->
                            <td>${item.fornecedor}</td>
                            <td>${item.sn}</td>
                        </tr>
                    `;
                    tableBody.append(row);
                });
            },
            error: function(err) {
                console.error("Erro ao buscar dados:", err);
            }
        });
    });
});
$(document).ready(function() {
$('#salvarCadastro').click(function() {
    // Aqui você pode processar os dados do formulário
    const nome = $('#nome').val();
    const maquina = $('#maquina').val();

    // Exemplo de como você pode usar os dados (enviar para o servidor, etc.)
    console.log("Nome:", nome);
    console.log("Máquina:", maquina);

    // Limpar os campos do formulário após salvar
    $('#nome').val('');
    $('#maquina').val('');

    // Fechar o modal após salvar
    $('#cadastroModal').modal('hide');
});
});
$(document).ready(function() {
// Função para enviar dados de cadastro de equipamento via AJAX
$('#saveMaquinaButton').click(function() {
    const nomeequipamento = $('#equipamentoNome').val();
    const porcentagemPt = $('#equipamentoPt').val();
    const porcentagemRh = $('#equipamentoRh').val();
    const porcentagemPd = $('#equipamentoPd').val();

    $.ajax({
        url: '/api/equipamentos',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ nomeequipamento, porcentagemPt, porcentagemRh, porcentagemPd }),
        success: function(response) {
            alert(response); // Exibir mensagem de sucesso
            $('#maquinaModal').modal('hide'); // Fechar modal após sucesso
            
            
            $('#equipamentoNome').val('');
        $('#equipamentoPt').val('');
        $('#equipamentoRh').val('');
        $('#equipamentoPd').val('');
            carregarOpcoesEquipamentos();
        },
        error: function(err) {
            console.error("Erro ao cadastrar equipamento:", err);
            alert("Erro ao cadastrar equipamento");
        }
    });
});

// Função para carregar opções de equipamentos no select
function carregarOpcoesEquipamentos() {
$.ajax({
    url: '/api/equipamentos',
    method: 'GET',
    success: function(data) {
        const selectMaquina = $('#maquina');
        selectMaquina.empty(); // Limpar opções existentes

        data.forEach(item => {
            selectMaquina.append(`<option value="${item.idequipamentos}">${item.nomeequipamento}</option>`);
        });
    },
    error: function(err) {
        console.error("Erro ao carregar equipamentos:", err);
    }
});
}

carregarOpcoesEquipamentos();
// Submeter o formulário de cadastro de representante
$('#cadastroForm').submit(function(event) {
    event.preventDefault();
    
    const formData = $(this).serialize();

    $.ajax({
        url: '/api/representantes',
        method: 'POST',
        data: formData,
        success: function(response) {
            console.log('Representante cadastrado com sucesso:', response);
            // Limpar formulário ou fazer outras operações após o cadastro
        },
        error: function(err) {
            console.error('Erro ao cadastrar representante:', err);
            // Tratar erros ou informar ao usuário
        }
    });
});
});
$('#salvarCadastro').click(function() {
const nome = $('#nome').val();
const maquina = $('#maquina').val();
// Limpar os campos do formulário após salvar
$('#nome').val('');
$('#maquina').val('');

// Fechar o modal após salvar
$('#cadastroModal').modal('hide');

$.ajax({
url: '/api/representantes',
method: 'POST',
contentType: 'application/json',
data: JSON.stringify({ nome, maquina }),
success: function(response) {
    alert(response);
    $('#cadastroModal').modal('hide');
},
error: function(err) {
    console.error("Erro ao cadastrar representante:", err);
    alert("Erro ao cadastrar representante");
}
});
});
$(document).ready(function() {
    // Função para carregar opções de fornecedores e exibir botões
    $.ajax({
        url: 'http://localhost:3001/representantes', // Endpoint para buscar representantes
        method: 'GET',
        success: function(data) {
            const fornecedoresButtons = $('#fornecedoresButtons');
            fornecedoresButtons.empty(); // Limpar botões existentes

            let row;
            data.forEach((item, index) => {
if (index % 50 === 0) {
row = $('<div class="row mb-3"></div>'); 
fornecedoresButtons.append(row);
}
const button = `
 <div class="col-md-2 mt-3">
                <button type="button" class="btn btn-primary btn-lg btn-uniform w-100 btn-custom" data-representante-id="${item.id}">${item.nome}</button>
            </div>
`;
row.append(button);


                // Adicionar um evento de clique para cada botão de fornecedor
                $(`button[data-representante-id="${item.id}"]`).click(function() {
                    const idRepresentante = $(this).data('representante-id');
                    loadRepresentanteInfo(item.nome);
                });
            });
        },
        error: function(err) {
            console.error("Erro ao carregar fornecedores:", err);
        }
    });

// Função para carregar as informações do representante
function loadRepresentanteInfo(nomeRepresentante) {
$.ajax({
    url: `http://localhost:3001/dados/${encodeURIComponent(nomeRepresentante)}`, // Endpoint para buscar dados do representante
    method: 'GET',
    success: function(dados) {
        console.log('Dados recebidos:', dados); // Log para verificar os dados recebidos

        // Limpar conteúdo anterior do modal
        $('#modalDataBody').empty();

        if (dados.length === 0) {
            $('#modalDataBody').append('<tr><td colspan="11">Nenhum dado encontrado para este representante.</td></tr>');
        } else {
            // Preencher o modal com os dados obtidos
            dados.forEach(dado => {
                const row = `
                    <tr>
                        <td>${dado.Npdf}</td>
                        <td>${dado.kg}</td>
                        <td>${dado.pd}</td>
                        <td>${dado.pt}</td>
                        <td>${dado.rh}</td>
                        <td>${dado.valorkg}</td>
                        <td>${dado.valor}</td>
                        <td>${dado.data}</td>
                        <td>${dado.hora}</td>
                        <td>${dado.fornecedor}</td>
                        <td>${dado.sn}</td>
                    </tr>
                `;
                console.log('Adicionando linha:', row); // Log para verificar cada linha adicionada
                $('#modalDataBody').append(row);
            });
        }

        // Abrir o modal após preencher os dados
        $('#detalhesModal').modal('show');
    },
    error: function(err) {
        console.error("Erro ao carregar dados do representante:", err);
    }
});
}
});
document.getElementById('exportToXLS').addEventListener('click', function() {
// Seleciona a tabela dentro do modal pelo ID
const table = document.getElementById('tableData');

// Array para armazenar os dados da tabela
const data = [];

// Itera pelas linhas da tabela
for (let i = 0; i < table.rows.length; i++) {
    const row = [];
    const cells = table.rows[i].cells;
    
    // Itera pelas células de cada linha
    for (let j = 0; j < cells.length; j++) {
        row.push(cells[j].innerText.trim()); // Adiciona o conteúdo da célula ao array da linha
    }
    
    data.push(row); // Adiciona a linha ao array de dados
}

// Cria a folha de trabalho XLS
const ws = XLSX.utils.aoa_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Planilha1');

// Baixa o arquivo XLS com os dados
XLSX.writeFile(wb, 'dados.xlsx');
});
document.getElementById('exportAllToExcel').addEventListener('click', function() {
    fetch('/api/exportarRepresentantes')
    .then(response => response.json())
    .then(data => {
        // Dados obtidos, vamos agrupar por representante
        const groupedData = data.reduce((acc, item) => {
            const representante = item.representante; // Ajuste de acordo com o nome da propriedade que contém o representante
            if (!acc[representante]) {
                acc[representante] = [];
            }
            // Remover a coluna 'iddados'
            const { iddados, ...filteredItem } = item;
            acc[representante].push(filteredItem);
            return acc;
        }, {});

        // Criar uma nova planilha
        const wb = XLSX.utils.book_new();

        // Adicionar uma aba para cada representante
        Object.keys(groupedData).forEach(representante => {
            const ws = XLSX.utils.json_to_sheet(groupedData[representante]);
            XLSX.utils.book_append_sheet(wb, ws, representante);
        });

        // Exportar o arquivo Excel
        XLSX.writeFile(wb, 'representantes_por_representante.xlsx');
    })
    .catch(error => {
        console.error('Erro ao exportar dados:', error);
        alert('Erro ao exportar dados. Por favor, tente novamente.');
    });
});

// Event listener para o botão "Cliente: EDITAR/EXCLUIR"
document.querySelector('.btn-danger').addEventListener('click', function() {
// Limpa a lista de representantes para evitar duplicações
const listaRepresentantes = document.getElementById('listaRepresentantes');
listaRepresentantes.innerHTML = '';

// Busca os representantes do backend e adiciona à lista
fetch('/api/representantes')
.then(response => response.json())
.then(data => {
    data.forEach(representante => {
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
            <span>${representante.nome}</span>
            <div>
                <button type="button" class="btn btn-primary btn-sm mr-2" onclick="editarRepresentante(${representante.id})">Editar</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirRepresentante(${representante.id})">Excluir</button>
            </div>
        `;
        listaRepresentantes.appendChild(listItem);
    });
})
.catch(error => {
    console.error('Erro ao carregar representantes:', error);
    alert('Erro ao carregar representantes. Por favor, tente novamente.');
});
});

// Função para editar representante
function editarRepresentante(idRepresentante) {
fetch(`/api/representantes/${idRepresentante}`)
.then(response => response.json())
.then(data => {
    const modalEdicao = document.getElementById('modalEdicaoRepresentante');
    modalEdicao.querySelector('#inputNome').value = data.nome;
    modalEdicao.setAttribute('data-idrepresentante', idRepresentante);
    $('#modalEdicaoRepresentante').modal('show');
})
.catch(error => {
    console.error('Erro ao carregar dados do representante:', error);
    alert('Erro ao carregar dados do representante. Por favor, tente novamente.');
});
}

// Função para excluir representante
function excluirRepresentante(representanteId) {
if (confirm('Tem certeza que deseja excluir este Representante?')) {
fetch(`/api/representantes/${representanteId}`, {
    method: 'DELETE',
})
.then(response => {
    if (!response.ok) {
        throw new Error('Erro ao excluir representante');
    }
    return response.json();
})
.then(data => {
    alert('Representante excluído com sucesso');
    // Atualiza a lista de representantes
    atualizarListaRepresentantes();
})
.catch(error => {
    console.error('Erro ao excluir representante:', error);
    alert('Erro ao excluir representante. Por favor, tente novamente.');
});
}
}

// Função para atualizar a lista de representantes na página
function atualizarListaRepresentantes() {
const listaRepresentantes = document.getElementById('listaRepresentantes');
listaRepresentantes.innerHTML = ''; // Limpa a lista atual

// Recarrega a lista de representantes do backend
fetch('/api/representantes')
.then(response => response.json())
.then(data => {
    data.forEach(representante => {
        const listItem = document.createElement('div');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        listItem.innerHTML = `
            <span>${representante.nome}</span>
            <div>
                <button type="button" class="btn btn-primary btn-sm mr-2" onclick="editarRepresentante(${representante.id})">Editar</button>
                <button type="button" class="btn btn-danger btn-sm" onclick="excluirRepresentante(${representante.id})">Excluir</button>
            </div>
        `;
        listaRepresentantes.appendChild(listItem);
    });
})
.catch(error => {
    console.error('Erro ao carregar representantes:', error);
    alert('Erro ao carregar representantes. Por favor, tente novamente.');
});
}


document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded and parsed');

    // Listar itens do lote
    document.getElementById('listLotesButton').addEventListener('click', function() {
        console.log('Listar Itens do Lote button clicked');

        const loteId = prompt('Digite o ID do lote para listar os itens:');
        console.log('Lote ID entered:', loteId);

        if (loteId) {
            fetch(`/api/lote/${loteId}/dados`)
            .then(response => {
                console.log('Fetch response status:', response.status);
                return response.json();
            })
            .then(data => {
                console.log('Data received:', data);

                const tableBody = document.querySelector('#loteItemsTable tbody');
                tableBody.innerHTML = ''; // Limpa a tabela

                data.forEach(item => {
                    const row = tableBody.insertRow();
                    row.insertCell(0).textContent = item.iddados; // ID
                    row.insertCell(1).textContent = item.npdf; // Nº PDF
                    row.insertCell(2).textContent = item.kg; // KG
                    row.insertCell(3).textContent = item.pd; // PD
                    row.insertCell(4).textContent = item.pt; // PT
                    row.insertCell(5).textContent = item.rh; // RH
                    row.insertCell(6).textContent = item.valor; // Valor
                    row.insertCell(7).textContent = item.representante; // Representante
                    row.insertCell(8).textContent = item.fornecedor; // Fornecedor
                    row.insertCell(9).textContent = item.sn; // SN
                    row.insertCell(10).textContent = item.lote; // Lote
                });
                // Abre o modal
                document.getElementById('loteModal').style.display = 'block';
            })
            .catch(error => {
                console.error('Erro ao listar dados do lote:', error);
                alert('Erro ao listar dados do lote. Tente novamente.');
            });
        }
    });

    // Fechar o modal
    document.querySelector('.close').addEventListener('click', function() {
        console.log('Modal close button clicked');
        document.getElementById('loteModal').style.display = 'none';
    });
});
