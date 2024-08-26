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
        url: '/api/representantes', // Endpoint para buscar representantes
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
    const loteSelecionado = document.getElementById('loteSelect').value.trim();

    if (!loteSelecionado) {
        document.getElementById('loteAlert').style.display = 'block';
        return;
    }

    document.getElementById('loteAlert').style.display = 'none';

    fetch(`/api/exportarRepresentantes?lote=${encodeURIComponent(loteSelecionado)}`)
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

document.getElementById('exportaOnderExcell').addEventListener('click', function() {
    const loteSelecionado = document.getElementById('loteSelect').value.trim();

    if (!loteSelecionado) {
        document.getElementById('loteAlert').style.display = 'block';
        return;
    }

    document.getElementById('loteAlert').style.display = 'none';
    
    fetch(`/api/exportarRepresentantes?lote=${encodeURIComponent(loteSelecionado)}`)
    .then(response => response.json())
    .then(data => {
        // Agrupar os dados por representante
        const groupedData = data.reduce((acc, item) => {
            const representante = item.representante;
            if (!acc[representante]) {
                acc[representante] = [];
            }
            acc[representante].push(item);
            return acc;
        }, {});

        let globalCounter = 1; // Contador global inicializado

        // Função para formatar valores em formato monetário brasileiro
        const formatCurrency = (value) => {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        };

        // Ordenar e formatar os dados para exportação
        const formattedData = Object.keys(groupedData)
            .sort()  // Ordenar os representantes em ordem alfabética
            .flatMap(representante => {
                let previousNpdf = null;
                return groupedData[representante].map(item => {
                    let npdfValue;
                    if (item.Npdf === previousNpdf) {
                        npdfValue = ''; // Deixar vazio se for repetido
                    } else {
                        npdfValue = globalCounter++; // Atribuir e incrementar o contador global
                    }
                    previousNpdf = item.Npdf;

                    const equipamento = item.sn;
                    // Extrair os últimos 3 dígitos do número de série (sn)
                    const lastThreeDigits = item.sn.slice(-3);
                    
                    // Combinar "Cambe" ou "Marcio" com os últimos 3 dígitos do SN dependendo do representante
                    let formattedEquipamento;
                    if (representante === "ANDERSON") {
                        formattedEquipamento = `CAMBE ${lastThreeDigits}`;
                    } else if (representante === "DEPÓSITO") {
                        formattedEquipamento = `MARCIO ${lastThreeDigits}`;
                    } else if (representante === "JOSE") {
                        formattedEquipamento = `JUAN ${lastThreeDigits}`;
                    } else if (representante === "LUCAS") {
                        formattedEquipamento = `GOIANIA ${lastThreeDigits}`;
                    } else if (representante === "ARIEL") {
                        if (equipamento.startsWith("ARG")) {
                            formattedEquipamento = `ARG ${lastThreeDigits}`;
                        } else if (equipamento.startsWith("SN-")) {
                            formattedEquipamento = `ARIEL ${lastThreeDigits}`;
                        } else {
                            formattedEquipamento = `${representante} ${lastThreeDigits}`;
                        }
                    } else {
                        formattedEquipamento = `${representante} ${lastThreeDigits}`;
                    }

                    return {
                        npdf: npdfValue,
                        comprador: representante, // Manter o nome original do representante
                        equipamento: formattedEquipamento, // Nome do representante ou "Cambe"/"Marcio" + últimos 3 dígitos do SN
                        valor: formatCurrency(parseFloat(item.Valor)), // Formatando o valor
                        pgto: item.pgto,
                        plan: item.tipo,
                        hedge: item.hedge,
                        pag: item.pag,
                        kg: item.kg.replace('.', ','), // Substituindo ponto por vírgula
                        pd: item.pd.replace('.', ','), // Substituindo ponto por vírgula
                        pt: item.pt.replace('.', ','), // Substituindo ponto por vírgula
                        rh: item.rh.replace('.', ',')  // Substituindo ponto por vírgula
                    };
                });
            });

        // Criar uma nova planilha
        const wb = XLSX.utils.book_new();

        // Adicionar os dados formatados a uma única aba
        const ws = XLSX.utils.json_to_sheet(formattedData);

        // Adicionar a aba à planilha
        XLSX.utils.book_append_sheet(wb, ws, 'Representantes');

        // Exportar o arquivo Excel
        XLSX.writeFile(wb, `representantes_${loteSelecionado}_formatados.xlsx`);
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
                    row.insertCell(6).textContent = item.Valor;
                    row.insertCell(6).textContent = item.tipo; // Valor
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

document.getElementById('editButton').addEventListener('click', function() {
    const table = document.getElementById('tableData');
    const isEditing = table.classList.contains('editing');

    if (!isEditing) {
        enableEditing(table);
        this.textContent = 'Salvar';
        table.classList.add('editing');
    } else {
        disableEditing(table);
        this.textContent = 'Editar';
        table.classList.remove('editing');
        saveTableData(table);
    }
});

function enableEditing(table) {
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = cell.textContent.trim(); // Remova espaços desnecessários
            cell.textContent = '';
            cell.appendChild(input);
        });
    });
}

function disableEditing(table) {
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            const input = cell.querySelector('input');
            if (input) {
                cell.textContent = input.value.trim(); // Remova espaços desnecessários
            }
        });
    });
}

function saveTableData(table) {
    const rows = table.querySelectorAll('tbody tr');
    const data = [];

    rows.forEach(row => {
        const rowData = {};
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => {
            const input = cell.querySelector('input');
            if (input && input.value) {
                const field = cell.getAttribute('data-field');
                if (field) {
                    rowData[field] = input.value;
                }
            }
        });
    
        if (Object.keys(rowData).length > 0) {
            data.push(rowData); // Adicione ao array somente se houver dados válidos
        }
    });
    

    console.log('Data to save:', data); // Log dos dados antes de enviar

    fetch('/api/salvar-edicoes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao salvar edições');
        }
        return response.json();
    })
    .then(result => {
        console.log('Edições salvas com sucesso:', result);
    })
    .catch(error => {
        console.error('Erro ao salvar edições:', error);
    });
    
}



$(document).ready(function() {
    $('.open-modal').on('click', function () {
        const nomeRepresentante = $(this).closest('.representante-card').data('representante');

        $.ajax({
            url: '/api/dados',
            method: 'GET',
            data: { nomeRepresentante: nomeRepresentante }, // Envia o nome do representante
            success: function(data) {
                console.log(data); // Verifique a estrutura dos dados recebidos

                const tableBody = $('#modalDataBody');
                tableBody.empty(); // Limpar o corpo da tabela

                data.forEach(item => {
                    const row = `
                        <tr>
                            <td data-field="Npdf">${item.Npdf}</td>
            <td data-field="kg">${item.kg}</td>
            <td data-field="pd">${item.pd}</td>
            <td data-field="pt">${item.pt}</td>
            <td data-field="rh">${item.rh}</td>
            <td data-field="valorkg">${item.valorkg}</td>
            <td data-field="Valor">${item.Valor}</td>
            <td data-field="tipo">${item.tipo}</td>
            <td data-field="data">${item.data}</td>
            <td data-field="hora">${item.hora}</td>
            <td data-field="fornecedor">${item.fornecedor}</td>
            <td data-field="sn">${item.sn}</td>
            <td>
                <button type="button" class="btn btn-sm btn-primary edit-row">Editar</button>
                <button type="button" class="btn btn-sm btn-success save-row" style="display:none;">Salvar</button>
            </td>
        </tr>
                    `;
                    tableBody.append(row);
                });

                // Abrir o modal após preencher os dados
                $('#detalhesModal').modal('show');
            },
            error: function(err) {
                console.error("Erro ao buscar dados:", err);
            }
        });
    });
});
$(document).ready(function() {
    // Carregar a lista de representantes e lotes ao carregar a página
    loadRepresentantes();
    loadLotes();

    // Adicionar um listener ao botão para carregar informações
    $('#loadInfoButton').click(function() {
        loadRepresentanteInfo();
    });
});

// Função para carregar a lista de representantes
function loadRepresentantes() {
    $.ajax({
        url: '/api/representantes', // Endpoint para buscar representantes
        method: 'GET',
        success: function(representantes) {
            // Ordenar os representantes por nome
            representantes.sort((a, b) => a.nome.localeCompare(b.nome));

            const representantesList = $('#representantesList');
            representantesList.empty(); // Limpar a lista existente

            // Adicionar botões para cada representante
            representantes.forEach(rep => {
                const button = `
                    <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-3">
                        <button class="btn btn-info btn-lg btn-block" onclick="showRepresentanteInfo('${rep.nome}')">${rep.nome}</button>
                    </div>`;
                representantesList.append(button);
            });
        },
        error: function(err) {
            console.error("Erro ao carregar representantes:", err);
        }
    });
}


// Função para carregar a lista de lotes
function loadLotes() {
    $.ajax({
        url: '/api/lote', // Endpoint para buscar lotes
        method: 'GET',
        success: function(lotes) {
            const loteSelect = $('#loteSelect');
            loteSelect.empty(); // Limpar o select antes de preencher
            loteSelect.append('<option value="" disabled selected>Escolha um lote</option>'); // Opção padrão

            lotes.forEach(lote => {
                const option = `<option value="${lote.nome}">${lote.nome}</option>`;
                loteSelect.append(option);
            });
        },
        error: function(err) {
            console.error("Erro ao carregar lotes:", err);
        }
    });
}

// Função para exibir informações do representante no modal
function showRepresentanteInfo(nomeRepresentante) {
    $('#detalhesModalLabel').text(`Detalhes do Representante: ${nomeRepresentante}`);
    loadRepresentanteInfo(nomeRepresentante);function loadRepresentanteInfo(nomeRepresentante) {
        const loteSelecionado = $('#loteSelect').val(); // Obtém o valor selecionado
    
        // Verifica se o lote foi selecionado
        if (!loteSelecionado) {
            // Exibe o alerta se o lote não estiver selecionado
            $('#loteAlert').show();
            return;
        }
    
        // Se o lote estiver selecionado, esconder o alerta
        $('#loteAlert').hide();
    
        // Continue com o carregamento dos dados do representante
        $.ajax({
            url: `/dados/${encodeURIComponent(nomeRepresentante)}?lote=${encodeURIComponent(loteSelecionado)}`,
            method: 'GET',
            success: function(dados) {
                console.log('Dados recebidos:', dados);
    
                // Limpar o conteúdo anterior do modal
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
                                <td>${dado.Valor}</td>
                                <td>${dado.tipo}</td>
                                <td>${dado.data}</td>
                                <td>${dado.hora}</td>
                                <td>${dado.fornecedor}</td>
                                <td>${dado.sn}</td>
                            </tr>
                        `;
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
    
}

// Função para carregar informações do representante baseado no nome e lote

document.getElementById('saveRepresentanteButton').addEventListener('click', function() {
    const modalEdicao = document.getElementById('modalEdicaoRepresentante');
    const idRepresentante = modalEdicao.getAttribute('data-idrepresentante');
    const nome = modalEdicao.querySelector('#inputNome').value.trim();

    if (!nome) {
        alert('O nome do representante é obrigatório.');
        return;
    }

    fetch(`/api/representantes/${idRepresentante}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome })
    })
    .then(response => {
        console.log('Resposta do servidor:', response); // Adicionado para depuração
        return response.json(); // Tente converter a resposta para JSON
    })
    .then(data => {
        console.log('Dados recebidos do servidor:', data); // Adicionado para depuração
        if (data.success) {
            alert(data.message);
            $('#modalEdicaoRepresentante').modal('hide');
            // Atualize a lista de representantes ou recarregue a página, conforme necessário
        } else {
            alert(data.error);
        }
    })
    .catch(error => {
        console.error('Erro ao atualizar o representante:', error);
        alert('Erro ao atualizar o representante. Por favor, tente novamente.');
    });
});

//iniciar o tooltip se tudo der certo!!
$(document).ready(function() {
    // Inicializar todos os tooltips
    $('[data-toggle="tooltip"]').tooltip();
});

