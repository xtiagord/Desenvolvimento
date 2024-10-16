$(document).ready(function () {
    $('#salvarCadastro').click(function () {
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
$(document).ready(function () {
    // Função para enviar dados de cadastro de equipamento via AJAX
    $('#saveMaquinaButton').click(function () {
        const nomeequipamento = $('#equipamentoNome').val();
        const porcentagemPt = $('#equipamentoPt').val();
        const porcentagemRh = $('#equipamentoRh').val();
        const porcentagemPd = $('#equipamentoPd').val();

        $.ajax({
            url: '/api/equipamentos',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ nomeequipamento, porcentagemPt, porcentagemRh, porcentagemPd }),
            success: function (response) {
                alert(response); // Exibir mensagem de sucesso
                $('#maquinaModal').modal('hide'); // Fechar modal após sucesso


                $('#equipamentoNome').val('');
                $('#equipamentoPt').val('');
                $('#equipamentoRh').val('');
                $('#equipamentoPd').val('');
                carregarOpcoesEquipamentos();
            },
            error: function (err) {
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
            success: function (data) {
                const selectMaquina = $('#maquina');
                selectMaquina.empty(); // Limpar opções existentes

                data.forEach(item => {
                    selectMaquina.append(`<option value="${item.idequipamentos}">${item.nomeequipamento}</option>`);
                });
            },
            error: function (err) {
                console.error("Erro ao carregar equipamentos:", err);
            }
        });
    }

    carregarOpcoesEquipamentos();
    // Submeter o formulário de cadastro de representante
    $('#cadastroForm').submit(function (event) {
        event.preventDefault();

        const formData = $(this).serialize();

        $.ajax({
            url: '/api/representantes',
            method: 'POST',
            data: formData,
            success: function (response) {
                console.log('Representante cadastrado com sucesso:', response);
                // Limpar formulário ou fazer outras operações após o cadastro
            },
            error: function (err) {
                console.error('Erro ao cadastrar representante:', err);
                // Tratar erros ou informar ao usuário
            }
        });
    });
});
$('#salvarCadastro').click(function () {
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
        success: function (response) {
            alert(response);
            $('#cadastroModal').modal('hide');
        },
        error: function (err) {
            console.error("Erro ao cadastrar representante:", err);
            alert("Erro ao cadastrar representante");
        }
    });
});
$(document).ready(function () {
    // Função para carregar opções de fornecedores e exibir botões
    $.ajax({
        url: '/api/representantes', // Endpoint para buscar representantes
        method: 'GET',
        success: function (data) {
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
                $(`button[data-representante-id="${item.id}"]`).click(function () {
                    const idRepresentante = $(this).data('representante-id');
                    loadRepresentanteInfo(item.nome);
                });
            });
        },
        error: function (err) {
            console.error("Erro ao carregar fornecedores:", err);
        }
    });


});
document.getElementById('exportToXLS').addEventListener('click', function () {
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
document.getElementById('exportAllToExcel').addEventListener('click', function () {
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
                // Ordenar os dados por Npdf numericamente
                const sortedData = groupedData[representante].sort((a, b) => {
                    const numA = parseFloat(a.Npdf) || 0;
                    const numB = parseFloat(b.Npdf) || 0;
                    return numA - numB;
                });

                // Calcular o total dos valores
                const totalValor = sortedData.reduce((total, item) => total + parseFloat(item.Valor) || 0, 0);
                const totalKg = sortedData.reduce((total, item) => total + parseFloat(item.kg) || 0, 0);
                const totalPd = sortedData.reduce((total, item) => total + parseFloat(item.pd) || 0, 0);
                const totalPt = sortedData.reduce((total, item) => total + parseFloat(item.pt) || 0, 0);
                const totalRh = sortedData.reduce((total, item) => total + parseFloat(item.rh) || 0, 0);

                // Adicionar a linha de total no final dos dados
                sortedData.push({
                    npdf: 'Total Geral',
                    fornecedor: '',
                    equipamento: '',
                    valor: totalValor, // Total dos valores
                    pgto: '',
                    plan: '',
                    hedge: '',
                    pag: '',
                    kg: totalKg,
                    pd: totalPd,
                    pt: totalPt,
                    rh: totalRh
                });

                // Criar a planilha para o representante
                const ws = XLSX.utils.json_to_sheet(sortedData);
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


document.getElementById('exportaOnderExcell').addEventListener('click', function () {
    const loteSelecionado = document.getElementById('loteSelect').value.trim();

    if (!loteSelecionado) {
        document.getElementById('loteAlert').style.display = 'block';
        return;
    }

    document.getElementById('loteAlert').style.display = 'none';

    fetch(`/api/exportarRepresentantes?lote=${encodeURIComponent(loteSelecionado)}`)
        .then(response => response.json())
        .then(data => {
            const groupedData = data.reduce((acc, item) => {
                const representante = item.representante;
                if (!acc[representante]) {
                    acc[representante] = [];
                }
                acc[representante].push(item);
                return acc;
            }, {});

            let globalCounter = 1;

            const formatFornecedor = (fornecedor) => {
                const nomePartes = fornecedor.trim().split(' ');
                if (nomePartes.length > 1) {
                    const primeiroNome = nomePartes[0];
                    const primeiraLetraSobrenome = nomePartes[1].charAt(0);
                    return `${primeiroNome} ${primeiraLetraSobrenome}c`;
                }
                return fornecedor;
            };

            let totalGlobalValor = 0;
            let totalGlobalKg = 0;
            let totalGlobalPd = 0;
            let totalGlobalPt = 0;
            let totalGlobalRh = 0;

            const formattedData = Object.keys(groupedData)
                .sort()
                .flatMap(representante => {
                    const sortedItems = groupedData[representante].sort((a, b) => {
                        const numA = parseFloat(a.Npdf) || 0;
                        const numB = parseFloat(b.Npdf) || 0;
                        return numA - numB;
                    });

                    let previousNpdf = null;

                    const rows = sortedItems.map(item => {
                        let npdfValue;
                        if (item.Npdf === previousNpdf) {
                            npdfValue = '';
                        } else {
                            npdfValue = globalCounter++;
                        }
                        previousNpdf = item.Npdf;

                        const equipamento = item.sn;
                        const lastThreeDigits = item.sn.slice(-3);

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

                        totalGlobalValor += parseFloat(item.Valor) || 0;
                        totalGlobalKg += parseFloat(item.kg) || 0;
                        totalGlobalPd += parseFloat(item.pd) || 0;
                        totalGlobalPt += parseFloat(item.pt) || 0;
                        totalGlobalRh += parseFloat(item.rh) || 0;

                        return {
                            npdf: npdfValue,
                            fornecedor: formatFornecedor(item.fornecedor),
                            equipamento: formattedEquipamento,
                            valor: parseFloat(item.Valor) || 0,
                            pgto: item.pgto,
                            plan: item.tipo,
                            hedge: item.hedge,
                            pag: item.pag,
                            kg: parseFloat(item.kg) || 0,
                            pd: parseFloat(item.pd) || 0,
                            pt: parseFloat(item.pt) || 0,
                            rh: parseFloat(item.rh) || 0
                        };
                    });

                    return rows;
                });

            formattedData.push({
                npdf: 'Total Geral',
                fornecedor: '',
                equipamento: '',
                valor: totalGlobalValor,
                pgto: '',
                plan: '',
                hedge: '',
                pag: '',
                kg: totalGlobalKg,
                pd: totalGlobalPd,
                pt: totalGlobalPt,
                rh: totalGlobalRh
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(formattedData);

            // Aplicar formatação para valores e colunas com 4 casas decimais
            Object.keys(ws).forEach(key => {
                if (key[0] === 'D') { // Coluna "valor" é a quarta (D)
                    ws[key].z = 'R$ #,##0.00';
                } else if (['I', 'J', 'K', 'L'].includes(key[0])) { // Colunas de quantidade (kg, pd, pt, rh)
                    ws[key].z = '#,##0.0000';
                }
            });

            // Ajuste de largura automática de colunas
            const maxLength = formattedData.reduce((acc, row) => {
                Object.keys(row).forEach((key, index) => {
                    const value = row[key]?.toString() || '';
                    acc[index] = Math.max(acc[index] || 0, value.length);
                });
                return acc;
            }, []);
            ws['!cols'] = maxLength.map(len => ({ wch: len + 4 })); // Adicionando +2 para uma margem de segurança

            XLSX.utils.book_append_sheet(wb, ws, 'Representantes');
            XLSX.writeFile(wb, `representantes_${loteSelecionado}_formatados.xlsx`);
        })
        .catch(error => {
            console.error('Erro ao exportar dados:', error);
            alert('Erro ao exportar dados. Por favor, tente novamente.');
        });
});

// Event listener para o botão "Cliente: EDITAR/EXCLUIR"
document.querySelector('.btn-danger').addEventListener('click', function () {
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


document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM fully loaded and parsed');

    // Listar itens do lote
    document.getElementById('listLotesButton').addEventListener('click', function () {
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
    document.querySelector('.close').addEventListener('click', function () {
        console.log('Modal close button clicked');
        document.getElementById('loteModal').style.display = 'none';
    });
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

/*$(document).ready(function() {
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
});*/
$(document).ready(function () {
    // Carregar a lista de representantes e lotes ao carregar a página
    loadRepresentantes();
    loadLotes();

    // Adicionar um listener ao botão para carregar informações
    $('#loadInfoButton').click(function () {
        loadRepresentanteInfo();
    });
    $('#loteSelect').change(function () {
        const loteId = $(this).val(); // Obtém o lote selecionado
        buscarDados(loteId); // Chama a função de busca com o lote selecionado
    });
    $('#loteSelect').change(function () {
        const loteId = $(this).val(); // Obtém o lote selecionado
        mediaDados(loteId); // Chama a função de busca com o lote selecionado
    });
    $('#loteSelect').change(function () {
        const loteId = $(this).val(); // Obtém o lote selecionado
        valorMediaTotal(loteId); // Chama a função de busca com o lote selecionado
    });
});

// Função para carregar a lista de representantes
function loadRepresentantes() {
    $.ajax({
        url: '/api/representantes', // Endpoint para buscar representantes
        method: 'GET',
        success: function (representantes) {
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
        error: function (err) {
            console.error("Erro ao carregar representantes:", err);
        }
    });
}


// Função para carregar a lista de lotes
function loadLotes() {
    $.ajax({
        url: '/api/lote', // Endpoint para buscar lotes
        method: 'GET',
        success: function (lotes) {
            const loteSelect = $('#loteSelect');
            loteSelect.empty(); // Limpar o select antes de preencher
            loteSelect.append('<option value="" disabled selected>Escolha um lote</option>'); // Opção padrão

            lotes.forEach(lote => {
                const option = `<option value="${lote.nome}">${lote.nome}</option>`;
                loteSelect.append(option);
            });
            // Defina aqui o lote padrão que você quer selecionar
            const lotePadrao = 'lote 31'; // Substitua pelo nome do lote que você deseja
            if (lotes.some(lote => lote.nome === lotePadrao)) {
                loteSelect.val(lotePadrao).trigger('change'); // Seleciona o lote padrão e dispara o evento change
            } else if (lotes.length > 0) {
                // Caso o lote padrão não exista, seleciona o primeiro da lista
                loteSelect.val(lotes[0].nome).trigger('change');
            }
        },
        error: function (err) {
            console.error("Erro ao carregar lotes:", err);
        }
    });
}

// Função para exibir informações do representante no modal
function showRepresentanteInfo(nomeRepresentante) {
    $('#detalhesModalLabel').text(`Detalhes do Representante: ${nomeRepresentante}`);
    loadRepresentanteInfo(nomeRepresentante);
}

function loadRepresentanteInfo(nomeRepresentante) {
    const loteSelecionado = $('#loteSelect').val();

    if (!loteSelecionado) {
        $('#loteAlert').show();
        return;
    }

    $('#loteAlert').hide();

    $.ajax({
        url: `/dados/${encodeURIComponent(nomeRepresentante)}?lote=${encodeURIComponent(loteSelecionado)}`,
        method: 'GET',
        success: function (dados) {
            console.log('Dados recebidos:', dados);
            $('#modalDataBody').empty();

            if (dados.length === 0) {
                $('#modalDataBody').append('<tr><td colspan="14">Nenhum dado encontrado para este representante.</td></tr>');
            } else {
                dados.sort((a, b) => a.Npdf - b.Npdf);

                dados.forEach(dado => {
                    console.log('ID do dado:', dado.id);
                    const row = `
                        <tr data-id="${dado.iddados}" class="clickable-row">
                            <td>${dado.Npdf}</td>
                            <td>${dado.kg}</td>
                            <td>${dado.pd}</td>
                            <td>${dado.pt}</td>
                            <td>${dado.rh}</td>
                            <td>${dado.valorkg}</td>
                            <td>${dado.Valor}</td>
                            <td>${dado.tipo}</td>
                            <td>${dado.hedge}</td>
                            <td>${dado.data}</td>
                            <td>${dado.hora}</td>
                            <td>${formatarNomeFornecedor(dado.fornecedor)}</td>
                            <td>${dado.sn}</td>
                            <td>${dado.lote}</td>
                            <td>
                                <button class="btn btn-sm btn-warning" onclick="editarLinha(${dado.iddados})">Editar</button>
                                <button class="btn btn-sm btn-danger" onclick="excluirLinha(${dado.iddados})">Excluir</button>
                            </td>
                        </tr>
                    `;
                    $('#modalDataBody').append(row);
                });

                // Atualizar os detalhes do representante
                const representanteStats = calcularEstatisticasRepresentante(dados);
                $('#valorTotal').text(representanteStats.valorTotal);
                $('#totalKg').text(representanteStats.totalKg);
                $('#mediaPdAjustada').text(representanteStats.mediaPdAjustada);
                $('#mediaPtAjustada').text(representanteStats.mediaPtAjustada);
                $('#mediaRhAjustada').text(representanteStats.mediaRhAjustada);
                $('#resultadoPd').text(representanteStats.resultadoPd);
                $('#resultadoPt').text(representanteStats.resultadoPt);
                $('#resultadoRh').text(representanteStats.resultadoRh);

                // Adiciona um evento de clique à linha para mostrar o PDF
                $('.clickable-row').on('click', function () {
                    const npdf = $(this).find('td:eq(0)').text(); // Ajuste o índice conforme necessário
                    mostrarPdf(npdf, nomeRepresentante, loteSelecionado); // Passa todos os parâmetros necessários
                });
            }

            $('#detalhesModal').modal('show');
        },
        error: function (err) {
            console.error("Erro ao carregar dados do representante:", err);
        }
    });
}

// Função para calcular as estatísticas do representante
function calcularEstatisticasRepresentante(dados) {
    let valorTotal = 0;
    let totalKg = 0;
    let totalPd = 0;
    let totalPt = 0;
    let totalRh = 0;

    dados.forEach(dado => {
        valorTotal += parseFloat(dado.Valor || 0);
        totalKg += parseFloat(dado.kg || 0);
        totalPd += parseFloat(dado.pd || 0);
        totalPt += parseFloat(dado.pt || 0);
        totalRh += parseFloat(dado.rh || 0);
    });

    return {
        valorTotal: valorTotal.toFixed(2),
        totalKg: totalKg.toFixed(2),
        mediaPdAjustada: (totalPd / dados.length).toFixed(4),
        mediaPtAjustada: (totalPt / dados.length).toFixed(4),
        mediaRhAjustada: (totalRh / dados.length).toFixed(4),
        resultadoPd: (valorTotal * 0.1).toFixed(2), // Exemplo de cálculo
        resultadoPt: (valorTotal * 0.2).toFixed(2), // Exemplo de cálculo
        resultadoRh: (valorTotal * 0.3).toFixed(2)  // Exemplo de cálculo
    };
}




function formatarNomeFornecedor(nome) {
    const [primeiroNome, segundoNome] = nome.split(" ");
    const primeiraLetraSobrenome = segundoNome ? segundoNome.charAt(0) + 'c' : '';
    return `${primeiroNome} ${primeiraLetraSobrenome}`;
}


// Função para carregar informações do representante baseado no nome e lote
document.getElementById('saveRepresentanteButton').addEventListener('click', function () {
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
$(document).ready(function () {
    // Inicializar todos os tooltips
    $('[data-toggle="tooltip"]').tooltip();
});

function excluirLinha(id) {
    console.log('ID recebido para exclusão:', id);

    if (!id) {
        console.error('ID não fornecido para exclusão');
        return;
    }

    fetch(`/api/dados/${id}`, {
        method: 'DELETE'
    })
        .then(response => response.text())
        .then(message => {
            console.log(message);
            // Atualizar a interface do usuário após a exclusão
            document.querySelector(`tr[data-id="${id}"]`).remove();
        })
        .catch(error => console.error('Erro ao excluir item:', error));
}

let idToDelete = null; // Variável global para armazenar o ID do item a ser excluído

function excluirLinha(id) {
    idToDelete = id; // Armazenar o ID do item a ser excluído

    // Abrir o modal de confirmação
    $('#confirmDeleteModal').modal('show');
}

// Função chamada quando o usuário confirma a exclusão
$('#confirmDeleteButton').click(function () {
    if (idToDelete !== null) {
        $.ajax({
            url: `/api/dados/${idToDelete}`,
            method: 'DELETE',
            success: function (response) {
                console.log('Item excluído com sucesso:', response);
                // Atualizar a tabela ou exibir uma mensagem de sucesso
                $('#modalDataBody').find(`tr[data-id="${idToDelete}"]`).remove();
                $('#confirmDeleteModal').modal('hide');
            },
            error: function (err) {
                console.error('Erro ao excluir item:', err);
            }
        });
    }
});

function editarLinha(id) {
    const row = $(`tr[data-id='${id}']`);
    const cells = row.find('td');

    cells.each((index, cell) => {
        if (index < cells.length - 1) { // Ignora a última célula (botões)
            const text = $(cell).text();
            if (index === 13) { // Supondo que o índice 13 seja para o lote
                // Busca os lotes e popula o <select>
                $.ajax({
                    url: '/api/lote',
                    method: 'GET',
                    success: function (lotes) {
                        let options = '';
                        lotes.forEach(lote => {
                            options += `<option value="${lote.nome}" ${text === lote.nome ? 'selected' : ''}>${lote.nome}</option>`;
                        });

                        $(cell).html(`
                            <select class="form-control">
                                ${options}
                            </select>
                        `);
                    },
                    error: function (err) {
                        console.error('Erro ao carregar lotes:', err);
                        $(cell).html('<select class="form-control"><option value="">Erro ao carregar lotes</option></select>');
                    }
                });
            } else {
                $(cell).html(`<input type="text" value="${text}" class="form-control">`);
            }
        }
    });

    const btn = $(row).find('.btn-warning');
    btn.text('Salvar');
    btn.removeClass('btn-warning').addClass('btn-success').attr('onclick', `salvarLinha(${id})`);
}


function salvarLinha(id) {
    const row = $(`tr[data-id='${id}']`);
    const inputs = row.find('input');
    const select = row.find('select');

    const updatedData = {
        Npdf: inputs.eq(0).val(),
        kg: inputs.eq(1).val(),
        pd: inputs.eq(2).val(),
        pt: inputs.eq(3).val(),
        rh: inputs.eq(4).val(),
        valorkg: inputs.eq(5).val(),
        Valor: inputs.eq(6).val(),
        tipo: inputs.eq(7).val(),
        hedge: inputs.eq(8).val(),
        data: inputs.eq(9).val(),
        hora: inputs.eq(10).val(),
        fornecedor: inputs.eq(11).val(),
        sn: inputs.eq(12).val(),
        lote: select.val()  // Adiciona o valor do campo lote
    };

    $.ajax({
        url: `/dados/${id}`,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(updatedData),
        success: function () {
            alert('Dado atualizado com sucesso');
            // Atualizar a linha com os novos valores
            row.find('td').each(function (index) {
                const input = $(this).find('input');
                const select = $(this).find('select');
                if (input.length) {
                    $(this).text(input.val());
                } else if (select.length) {
                    $(this).text(select.val());  // Atualiza o texto com o valor do select
                }
            });

            // Mudar o botão de volta para "Editar"
            row.find('button.btn-success').text('Editar').attr('onclick', `editarLinha(${id})`).removeClass('btn-success').addClass('btn-warning');
        },
        error: function (err) {
            console.error('Erro ao atualizar dado:', err);
            alert('Erro ao atualizar dado');
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {
    loadLotes();

    $('#loteSelect').on('change', function () {
        const lote = $(this).val();

        if (!lote) {
            $('#loteAlert').show();
            return;
        }

        $('#loteAlert').hide();

        $.ajax({
            url: `/api/representantes_financeiros/geral?lote=${lote}`,
            method: 'GET',
            success: function (data) {
                const tabela = $('#tabela-representantes');
                tabela.empty();

                data.forEach(item => {
                    const compraCatalisador = parseFloat(item.compra_catalisador) || 0;
                    const saldoAdiantamentos = item.saldo_adiantamentos === '-' ? 0 : parseFloat(item.saldo_adiantamentos);
                    const totalValorPecas = parseFloat(item.total_valor_pecas) || 0;
                    const saldoTotal = compraCatalisador + totalValorPecas - saldoAdiantamentos;
                    const saldoClass = saldoTotal >= 0 ? 'saldo-positivo' : 'saldo-negativo';

                    const row = `
                        <tr class="draggable" data-representante="${item.representante}">
                            <td>${item.representante}</td>
                            <td>${item.total_kg}</td>
                            <td class="compra-catalisador">${compraCatalisador.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td class="saldo-adiantamentos">${saldoAdiantamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td class="total-valor-pecas">${totalValorPecas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            <td class="${saldoClass}">${saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        </tr>
                    `;
                    tabela.append(row);
                });

                // Adiciona a funcionalidade de arrastar e soltar
                makeRowsDraggable();
            },
            error: function (err) {
                console.error("Erro ao carregar dados dos representantes:", err);
            }
        });
    });

    function makeRowsDraggable() {
        $('.draggable').draggable({
            revert: 'invalid',
            helper: 'clone',
            start: function () {
                $(this).addClass('dragging'); // Marca a linha que está sendo arrastada
            },
            stop: function () {
                $(this).removeClass('dragging'); // Remove a marcação quando o arrasto parar
            }
        });

        $('.draggable').droppable({
            accept: '.draggable',
            drop: function (event, ui) {
                const draggedRow = ui.draggable;
                const droppedRow = $(this);

                // Obtém os representantes da linha arrastada e da linha solta
                const representante1 = draggedRow.data('representante');
                const representante2 = droppedRow.data('representante');

                // Array para armazenar os representantes
                let representantes = [representante1, representante2];

                // Verifica se a linha solta já foi unificada
                if (droppedRow.hasClass('unified')) {
                    const existingRepresentantes = droppedRow.data('representantes').split(' / ');
                    representantes = [...new Set([...representantes, ...existingRepresentantes])]; // Adiciona representantes existentes
                }

                // Garante que não tenha mais de 4 representantes
                if (representantes.length > 4) {
                    alert('Você pode unir no máximo 4 representantes.');
                    return;
                }

                // Remove representantes duplicados
                representantes = [...new Set(representantes)];

                // Soma os valores das colunas
                const totalKg = parseFloat(draggedRow.children().eq(1).text()) + parseFloat(droppedRow.children().eq(1).text());
                const compraCatalisador = parseFloat(draggedRow.children().eq(2).text().replace('R$', '').replace('.', '').replace(',', '.')) +
                    parseFloat(droppedRow.children().eq(2).text().replace('R$', '').replace('.', '').replace(',', '.'));
                const saldoAdiantamentos = parseFloat(draggedRow.children().eq(3).text().replace('R$', '').replace('.', '').replace(',', '.')) +
                    parseFloat(droppedRow.children().eq(3).text().replace('R$', '').replace('.', '').replace(',', '.'));
                const totalValorPecas = parseFloat(draggedRow.children().eq(4).text().replace('R$', '').replace('.', '').replace(',', '.')) +
                    parseFloat(droppedRow.children().eq(4).text().replace('R$', '').replace('.', '').replace(',', '.'));

                // Calcula o saldo total
                const saldoTotal = compraCatalisador + totalValorPecas - saldoAdiantamentos;
                const saldoClass = saldoTotal >= 0 ? 'saldo-positivo' : 'saldo-negativo';
                const saldoTotalFormatado = saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                // Cria a nova linha unificada
                const newRow = `
                    <tr class="unified" data-representantes="${representantes.join(' / ')}">
                        <td>${representantes.join(' / ')}</td>
                        <td>${totalKg}</td>
                        <td class="compra-catalisador">${compraCatalisador.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td class="saldo-adiantamentos">${saldoAdiantamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td class="total-valor-pecas">${totalValorPecas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                        <td class="${saldoClass}">${saldoTotalFormatado}</td>
                    </tr>
                `;

                // Remove a linha arrastada e a linha solta
                draggedRow.remove();
                droppedRow.remove();

                // Adiciona a nova linha unificada à tabela
                $('#tabela-representantes').append(newRow);
                makeRowsDraggable(); // Reaplica a funcionalidade draggable

                // Adiciona um efeito visual
                $(newRow).hide().fadeIn(200);
            }
        });
    }
});

function mostrarPdf(npdf, representanteNome, loteId) {
    console.log('Dentro da função mostrarPdf:');
    console.log('npdf:', npdf);
    console.log('representanteNome:', representanteNome);
    console.log('loteId:', loteId);

    // Verifica se todos os parâmetros foram fornecidos
    if (!npdf || !representanteNome || !loteId) {
        console.error('Parâmetros necessários não fornecidos:', { npdf, representanteNome, loteId });
        return;
    }

    // Buscar o ID do representante com base no nome
    $.ajax({
        url: `/api/representante-id?nome=${encodeURIComponent(representanteNome)}`,
        method: 'GET',
        success: function (response) {
            const representanteId = response.id;

            console.log('ID do representante encontrado:', representanteId);

            // Fazer a requisição para buscar o PDF com o ID do representante
            $.ajax({
                url: `/api/pdf?representante_id=${encodeURIComponent(representanteId)}&lote_id=${encodeURIComponent(loteId)}&npdf=${encodeURIComponent(npdf)}`,
                method: 'GET',
                xhrFields: {
                    responseType: 'blob'  // Define o tipo de resposta como 'blob' para arquivos binários
                },
                success: function (pdfData) {
                    console.log('PDF carregado com sucesso.');

                    // Cria um URL temporário para o PDF recebido e exibe no modal
                    const pdfUrl = URL.createObjectURL(pdfData);
                    $('#pdfViewer').attr('src', pdfUrl);  // Exibe o PDF dentro do elemento embed no modal

                    // Atualiza o título do modal com o NDPF
                    $('#pdfModalLabel').text(`Número PDF: ${npdf}`);

                    // Mostra o modal com o PDF
                    $('#pdfModal').modal('show');
                },
                error: function (err) {
                    console.error('Erro ao carregar o PDF:', err);
                    alert('Erro ao carregar o PDF');
                }
            });
        },
        error: function (err) {
            console.error('Erro ao buscar o ID do representante:', err);
            alert('Erro ao buscar o ID do representante');
        }
    });
}

$(document).ready(function () {
    // Habilita o arrasto para o modal
    $('#pdfModal').draggable({
        handle: '.modal-header' // Faz com que a área de arrasto seja o cabeçalho do modal
    });
});


// Função para buscar dados do servidor com base no lote selecionado
function buscarDados(loteId) {
    console.log("Buscando dados para o lote:", loteId);
    fetch(`/api/movimentacao-financeira?lote=${loteId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados recebidos:", data);
            const tabelaRepresentantes = document.getElementById('tabela-representantes-geral');
            tabelaRepresentantes.innerHTML = ''; // Limpar a tabela antes de preencher

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(representante => {
                    adicionarLinha(representante); // Adiciona as linhas na tabela
                });
            } else {
                console.error("Os dados recebidos não estão no formato esperado ou estão vazios.");
            }
        })
        .catch(error => {
            console.error("Erro ao buscar dados:", error);
        });
}

// Função para adicionar uma linha na tabela
function adicionarLinha(representante) {
    const tabelaRepresentantes = document.getElementById('tabela-representantes-geral');
    const row = document.createElement('tr');

    const totalKg = parseFloat(representante.total_kg) || 0;
    const resultadoPd = parseFloat(representante.resultado_pd) || 0;
    const resultadoPt = parseFloat(representante.resultado_pt) || 0;
    const resultadoRh = parseFloat(representante.resultado_rh) || 0;
    const valorTotal = parseFloat(representante.valor_total) || 0;
    const mediaTotal = parseFloat(representante.media_kg) || 0;

    row.innerHTML = `
        <td>${representante.representante}</td>
        <td>${totalKg.toFixed(4)}</td>
        <td>${resultadoPd.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
        <td>${resultadoPt.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
        <td>${resultadoRh.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
        <td>R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td class="bg-amarelo">${mediaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
    `;

    // Adiciona o evento de clique à linha
    row.addEventListener('click', () => {
        mostrarCalculos(representante);
    });

    tabelaRepresentantes.appendChild(row);
}

function mostrarCalculos(representante) {
    console.log(representante); // Verifica o conteúdo do objeto

    // Seleciona o elemento do título do modal
    const tituloModal = document.getElementById('modalCalculosLabel');
    // Atualiza o título com o nome do representante
    tituloModal.textContent = `Cálculos do Representante: ${representante.nome_representante}`;


    const calculosRepresentante = document.getElementById('calculosRepresentante');
    calculosRepresentante.innerHTML = ''; // Limpar o conteúdo anterior

    // Adicionar os dados do representante ao modal
    calculosRepresentante.innerHTML += `
        <tr>
            <td>Total KG</td>
            <td>${(parseFloat(representante.total_kg) || 0).toFixed(4)}</td>
            <td>Aqui é calculado todos os kgs do representante</td>
        </tr>
        <tr>
            <td>Valor Total</td>
            <td>R$ ${(parseFloat(representante.valor_total) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>Soma Valor total dos materiais</td>
        </tr>
        <tr>
            <td>Total Pd</td>
            <td>${(parseFloat(representante.total_pd) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Soma todos os valores do material Pd (PALÁDIO)</td>
        </tr>
        <tr>
            <td>Total Pd</td>
            <td>${(parseFloat(representante.total_pt) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Soma todos os valores do material Pt (PLATINA)</td>
        </tr>
        <tr>
            <td>Total Rh</td>
            <td>${(parseFloat(representante.total_rh) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Soma todos os valores do material Rh (RÓDIO)</td>
        </tr>
        <tr>
            <td>Total PD Ajustado pela Porcentagem</td>
            <td>${(parseFloat(representante.porcentagem_Pd) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Porcentagem da maquina Pd</td>
        </tr>
        <tr>
            <td>Total PT Ajustado pela Porcentagem</td>
            <td>${(parseFloat(representante.porcentagem_Pt) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Porcentagem da maquina Pt</td>
        </tr>
        <tr>
            <td>Total RH Ajustado pela Porcentagem</td>
            <td>${(parseFloat(representante.porcentagem_rh) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Porcentagem da maquina Rh</td>
        </tr>
        <tr>
            <td>Cálculo total PD pela Porcentagem</td>
            <td>${(parseFloat(representante.total_pd_ajustado) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Calcula o total de pd, ajustado pela porcentagem porcentagemPd. O ajuste é feito subtraindo a parte correspondente a porcentagemPd. Fórmula do cálculo (Pd-(pd*PorcentagemPd))</td>
        </tr>
        <tr>
            <td>Cálculo total Pt pela Porcentagem</td>
            <td>${(parseFloat(representante.total_pt_ajustado) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Calcula o total de pt, ajustado pela porcentagem porcentagemPt. O ajuste é feito subtraindo a parte correspondente a porcentagemPt. Fórmula do cálculo (Pt-(pt*PorcentagemPt))</td>
        </tr>
        <tr>
            <td>Cálculo Total RH pela Porcentagem</td>
            <td>${(parseFloat(representante.total_rh_ajustado) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Calcula o total de rh, ajustado pela porcentagem porcentagemRh. O ajuste é feito subtraindo a parte correspondente a porcentagemRh. Fórmula do cálculo (Rh-(rh*PorcentagemRh))</td>
        </tr>
        <tr>
            <td>Média PD Total</td>
            <td>${(parseFloat(representante.media_pd_ajustada) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Calcula a Média Total do pd ajustada pela porcentagem. Fórmula Pd Ajustada pela Porcentagem / Total de Kg</td>
        </tr>
        <tr>
            <td>Média PT Total</td>
            <td>${(parseFloat(representante.media_pt_ajustada) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
             <td>Calcula a Média Total do pt ajustada pela porcentagem. Fórmula Pt Ajustada pela Porcentagem / Total de Kg</td>
        </tr>
        <tr>
            <td>Média RH Total</td>
            <td>${(parseFloat(representante.media_rh_ajustada) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Calcula a Média Total do rh ajustada pela porcentagem. Fórmula RH Ajustada pela Porcentagem / Total de Kg</td>
        </tr>
         <tr>
            <td>Resultado final PD</td>
            <td>${(parseFloat(representante.resultado_pd) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Aqui temos o resultado final de Pd. A fórmula do cálculo usada é Pd * Total de kg divido por 1000 </td>
        </tr>
        <tr>
            <td>Resultado final PT</td>
            <td>${(parseFloat(representante.resultado_pt) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Aqui temos o resultado final de Pt. A fórmula do cálculo usada é Pt * Total de kg divido por 1000 </td>
        </tr>
        <tr>
            <td>Resultado final RH</td>
            <td>${(parseFloat(representante.resultado_rh) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
            <td>Aqui temos o resultado final de Rh. A fórmula do cálculo usada é Rh * Total de kg divido por 1000 </td>
        </tr>
        <tr>
            <td>Valor Total</td>
            <td>R$ ${(parseFloat(representante.media_kg) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>Calula a média de valor divido pelo total de KG</td>
        </tr>
    `;

    // Exibir o modal
    const modal = new bootstrap.Modal(document.getElementById('modalCalculos'));
    modal.show();
}



// Função para buscar dados do servidor com base no lote selecionado
function mediaDados(loteId) {
    console.log("Buscando dados para o lote:", loteId);
    fetch(`/api/movimentacao-financeira-total?lote=${loteId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados recebidos:", data);
            const mediaTotais = document.getElementById('medias-pd-pt-rh');
            mediaTotais.innerHTML = ''; // Limpar a tabela antes de preencher

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(representante => {
                    adicionarLinhaMedia(representante); // Adiciona as linhas na tabela
                });
            } else {
                console.error("Os dados recebidos não estão no formato esperado ou estão vazios.");
            }
        })
        .catch(error => {
            console.error("Erro ao buscar dados:", error);
        });
}

// Função para adicionar uma linha na tabela
function adicionarLinhaMedia(representante) {
    const tabelaRepresentantes = document.getElementById('medias-pd-pt-rh');

    const resultadoMediaPD = parseFloat(representante.total_resultado_pd) || 0;
    const resultadoMediaPt = parseFloat(representante.total_resultado_pt) || 0;
    const resultadoMediaRh = parseFloat(representante.total_resultado_rh) || 0;

    // Adiciona linha para PD
    const rowPD = document.createElement('tr');
    rowPD.innerHTML = `
        <td>PD</td>
        <td>${resultadoMediaPD.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
    `;
    tabelaRepresentantes.appendChild(rowPD);

    // Adiciona linha para PT
    const rowPT = document.createElement('tr');
    rowPT.innerHTML = `
        <td>PT</td>
        <td>${resultadoMediaPt.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
    `;
    tabelaRepresentantes.appendChild(rowPT);

    // Adiciona linha para RH
    const rowRH = document.createElement('tr');
    rowRH.innerHTML = `
        <td>RH</td>
        <td>${resultadoMediaRh.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
    `;
    tabelaRepresentantes.appendChild(rowRH);
}

// Função para buscar dados do servidor com base no lote selecionado
function valorMediaTotal(loteId) {
    console.log("Buscando dados para o lote:", loteId);
    fetch(`/api/calcular-media/${loteId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Dados recebidos:", data);
            const somaMedias = document.getElementById('valor-media-total');
            somaMedias.innerHTML = ''; // Limpar a tabela antes de preencher

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(representante => {
                    adicionarLinhaValorTotal(representante); // Adiciona as linhas na tabela
                });
            } else {
                console.error("Os dados recebidos não estão no formato esperado ou estão vazios.");
            }
        })
        .catch(error => {
            console.error("Erro ao buscar dados:", error);
        });
}

// Função para adicionar uma linha na tabela
function adicionarLinhaValorTotal(representante) {
    const tabelaRepresentantes = document.getElementById('valor-media-total');

    const resultadoSomaTotal = parseFloat(representante.soma_valor_total) || 0;
    const resultadoSomaKg = parseFloat(representante.soma_total_kg) || 0;
    const resultadoMediaKg = parseFloat(representante.media_valor_por_kg) || 0;

    // Adiciona linha para PD
    const rowPD = document.createElement('tr');
    rowPD.innerHTML = `
    <td>Valor Total</td>
    <td>R$ ${resultadoSomaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
`;
    tabelaRepresentantes.appendChild(rowPD);

    // Adiciona linha para PT
    const rowPT = document.createElement('tr');
    rowPT.innerHTML = `
    <td>Total Kg</td>
    <td>${resultadoSomaKg.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</td>
`;
    tabelaRepresentantes.appendChild(rowPT);

    // Adiciona linha para RH
    const rowRH = document.createElement('tr');
    rowRH.innerHTML = `
    <td>Média Valor por Kg</td>
    <td>R$ ${resultadoMediaKg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
`;
    tabelaRepresentantes.appendChild(rowRH);

}
