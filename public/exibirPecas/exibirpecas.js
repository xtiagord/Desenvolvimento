document.addEventListener('DOMContentLoaded', function() {
    loadRepresentantes();
    loadLotes();
});

let selectedLote = ''; // Variável global para armazenar o lote selecionado

function loadRepresentantes() {
    fetch('/api/representantes')
        .then(response => response.json())
        .then(representantes => {
            representantes.sort((a, b) => a.nome.localeCompare(b.nome));

            const representantesList = document.getElementById('representantes-buttons');
            representantesList.innerHTML = ''; // Limpar a lista existente

            let row;
            representantes.forEach((rep, index) => {
                if (index % 50 === 0) {
                    row = document.createElement('div');
                    row.className = 'row mb-3'; // Linha para os botões
                    representantesList.appendChild(row);
                }

                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-info btn-lg btn-block';
                button.textContent = rep.nome;
                button.dataset.id = rep.id; // Adicionar o ID como dado do botão

                // Adiciona um tooltip vazio inicialmente
                button.setAttribute('data-toggle', 'tooltip');
                button.setAttribute('data-placement', 'top');
                button.setAttribute('title', '');

                button.addEventListener('click', function(event) {
                    if (!selectedLote) {
                        const errorMessage = document.getElementById('error-message');
                        errorMessage.classList.remove('d-none');
                        event.stopImmediatePropagation(); // Impede a propagação do evento
                        return;
                    }

                    const errorMessage = document.getElementById('error-message');
                    errorMessage.classList.add('d-none');

                    // Atualiza o tooltip com a quantidade e valor total
                    updateTooltip(rep.id);

                    // Chamar a função para carregar as peças no modal
                    fetchPecasData(rep.id);
                });

                const col = document.createElement('div');
                col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-3';
                col.appendChild(button);

                row.appendChild(col);

                const modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.id = `representante${rep.id}Modal`;
                modal.tabIndex = '-1';
                modal.role = 'dialog';
                modal.setAttribute('aria-labelledby', `representante${rep.id}ModalLabel`);
                modal.setAttribute('aria-hidden', 'true');
                modal.innerHTML = `
                    <div class="modal-dialog modal-dialog-scrollable" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="representante${rep.id}ModalLabel">Peças de ${rep.nome}</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Clientes</th>
                                            <th>Tipo</th>
                                            <th>Modelo</th>
                                            <th>Código</th>
                                            <th>Quantidade</th>
                                            <th>Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody id="modal-rep-pecas-${rep.id}">
                                        <!-- Dados das peças serão preenchidos dinamicamente -->
                                    </tbody>
                                </table>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>
                                <button type="button" class="btn btn-primary" onclick="exportToExcel(${rep.id})">Exportar para Excel</button>
                            </div>
                        </div>
                    </div>
                `;
                document.getElementById('representantes-modals').appendChild(modal);
            });

            // Inicializa os tooltips após adicionar os botões
            $(function () {
                $('[data-toggle="tooltip"]').tooltip();
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}

function updateTooltip(repId) {
    // Obtém os dados das peças para o representante selecionado
    fetch(`/api/representantes/${repId}/pecas?lote=${selectedLote}`)
        .then(response => response.json())
        .then(data => {
            const totalQuantity = data.reduce((total, peca) => total + parseFloat(peca.quantidade.replace(' UN', '').replace(',', '.')) || 0, 0).toFixed(2);
            const totalValue = data.reduce((total, peca) => total + parseFloat(peca.valor.replace(' R$', '').replace(',', '.')) || 0, 0).toFixed(2);

            // Atualiza o tooltip do botão
            const button = document.querySelector(`button[data-id='${repId}']`);
            if (button) {
                button.setAttribute('title', `Quantidade Total: ${totalQuantity} UN\nValor Total: R$ ${totalValue}`);
                $(button).tooltip('update'); // Atualiza o tooltip
            }
        })
        .catch(error => console.error('Error fetching pieces data:', error));
}


function loadLotes() {
    fetch('/api/lote')
        .then(response => response.json())
        .then(lotes => {
            console.log('Lotes recebidos:', lotes);

            const selectLote = document.getElementById('select-lote');
            selectLote.innerHTML = '<option value="">Selecione o lote</option>';

            lotes.forEach(lote => {
                const option = document.createElement('option');
                option.value = lote.nome;
                option.textContent = lote.nome;
                selectLote.appendChild(option);
            });

            selectLote.addEventListener('change', () => {
                selectedLote = selectLote.value;
                console.log(`Lote selecionado: ${selectedLote}`);

                const errorMessage = document.getElementById('error-message');
                errorMessage.classList.add('d-none');
            });
        })
        .catch(error => console.error('Erro ao carregar lotes:', error));
}

function fetchPecasData(id) {
    if (!selectedLote) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.classList.remove('d-none');
        return;
    }

    fetch(`/api/representantes/${id}/pecas?lote=${selectedLote}`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById(`modal-rep-pecas-${id}`);
            tbody.innerHTML = '';

            data.forEach(peca => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${peca.clientes}</td>
                    <td>${peca.tipo}</td>
                    <td>${peca.modelo}</td>
                    <td>${peca.codigo}</td>
                    <td>${peca.quantidade}</td>
                    <td>${peca.valor}</td>
                `;
                tbody.appendChild(row);
            });

            // Após atualizar os dados, abrir o modal
            const modal = document.getElementById(`representante${id}Modal`);
            if (modal) {
                $(modal).modal('show');
            }
        })
        .catch(error => console.error('Error fetching peças data:', error));
}

function exportToExcel(representanteId) {
    const tbody = document.getElementById(`modal-rep-pecas-${representanteId}`);
    const rows = Array.from(tbody.getElementsByTagName('tr'));

    // Cria um novo workbook e uma nova planilha
    const wb = XLSX.utils.book_new();
    const ws_data = [
        ['Clientes', 'Tipo', 'Modelo', 'Código', 'Quantidade', 'Valor'], // Cabeçalho
        ...rows.map(row => {
            return Array.from(row.getElementsByTagName('td')).map(td => td.textContent.trim());
        }), // Dados das peças
        [], // Linha em branco
        ['', '', '', '', 'Total Quantidade', rows.reduce((total, row) => total + parseFloat(row.getElementsByTagName('td')[4].textContent.trim().replace(' UN', '').replace(',', '.')) || 0, 0).toFixed(2)], // Total Quantidade
        ['', '', '', '', 'Total Valor', rows.reduce((total, row) => total + parseFloat(row.getElementsByTagName('td')[5].textContent.trim().replace(' R$', '').replace(',', '.')) || 0, 0).toFixed(2)] // Total Valor
    ];

    // Converte o array para uma planilha
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Define os estilos para o cabeçalho e dados
    const headerStyle = {
        fill: { fgColor: { rgb: 'ADD8E6' } }, // Azul claro para cabeçalho
        font: { bold: true }
    };
    
    const dataStyle = {
        fill: { fgColor: { rgb: 'D3D3D3' } } // Cinza claro para dados
    };

    // Define o estilo para a célula A2 com fundo amarelo
    const specialCellStyle = {
        fill: { fgColor: { rgb: 'FFFF00' } }, // Amarelo para A2
        font: { bold: true }
    };

    // Aplica o estilo às células do cabeçalho (linha 1)
    const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'];
    headerCells.forEach(cellAddress => {
        if (!ws[cellAddress]) ws[cellAddress] = {};
        ws[cellAddress].s = headerStyle;
    });

    // Aplica o estilo às células de dados
    for (let r = 2; r <= rows.length + 1; r++) {
        for (let c = 0; c < 6; c++) {
            const cellAddress = XLSX.utils.encode_cell({ r, c });
            if (!ws[cellAddress]) ws[cellAddress] = {};
            ws[cellAddress].s = dataStyle;
        }
    }

    // Aplica o estilo especial à célula A2
    const specialCellAddress = 'A2';
    if (!ws[specialCellAddress]) ws[specialCellAddress] = {};
    ws[specialCellAddress].s = specialCellStyle;

    // Ajusta a largura das colunas
    ws['!cols'] = [
        { wch: 20 }, // Ajuste de largura da coluna A
        { wch: 15 }, // Ajuste de largura da coluna B
        { wch: 15 }, // Ajuste de largura da coluna C
        { wch: 15 }, // Ajuste de largura da coluna D
        { wch: 20 }, // Ajuste de largura da coluna E
        { wch: 20 }  // Ajuste de largura da coluna F
    ];

    // Adiciona a planilha ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Peças');

    // Gera o arquivo e força o download
    XLSX.writeFile(wb, `pecas_representante_${representanteId}.xlsx`);
}

function exportAllToExcel() {
    if (!selectedLote) {
        const errorMessage = document.getElementById('error-message');
        errorMessage.classList.remove('d-none');
        return;
    }

    // Esconde a mensagem de erro se o lote estiver selecionado
    const errorMessage = document.getElementById('error-message');
    errorMessage.classList.add('d-none');

    // Obtém todos os representantes
    fetch('/api/representantes')
        .then(response => response.json())
        .then(representantes => {
            const wb = XLSX.utils.book_new();

            // Itera sobre cada representante
            const fetchPromises = representantes.map(rep => {
                return fetch(`/api/representantes/${rep.id}/pecas?lote=${selectedLote}`)
                    .then(response => response.json())
                    .then(data => {
                        // Cria os dados da planilha para o representante
                        const ws_data = [
                            ['Clientes', 'Tipo', 'Modelo', 'Código', 'Quantidade', 'Valor'], // Cabeçalho
                            ...data.map(peca => [
                                peca.clientes,
                                peca.tipo,
                                peca.modelo,
                                peca.codigo,
                                peca.quantidade,
                                peca.valor
                            ]), // Dados das peças
                            [], // Linha em branco
                            ['', '', '', '', 'Total Quantidade', data.reduce((total, peca) => total + parseFloat(peca.quantidade.replace(' UN', '').replace(',', '.')) || 0, 0).toFixed(2)], // Total Quantidade
                            ['', '', '', '', 'Total Valor', data.reduce((total, peca) => total + parseFloat(peca.valor.replace(' R$', '').replace(',', '.')) || 0, 0).toFixed(2)] // Total Valor
                        ];

                        // Cria uma nova planilha para o representante
                        const ws = XLSX.utils.aoa_to_sheet(ws_data);

                        // Define os estilos (opcional)
                        const headerStyle = {
                            fill: { fgColor: { rgb: 'ADD8E6' } }, // Azul claro para cabeçalho
                            font: { bold: true }
                        };
                        const dataStyle = {
                            fill: { fgColor: { rgb: 'D3D3D3' } } // Cinza claro para dados
                        };
                        const headerCells = ['A1', 'B1', 'C1', 'D1', 'E1', 'F1'];
                        headerCells.forEach(cellAddress => {
                            if (!ws[cellAddress]) ws[cellAddress] = {};
                            ws[cellAddress].s = headerStyle;
                        });

                        for (let r = 2; r <= data.length + 1; r++) {
                            for (let c = 0; c < 6; c++) {
                                const cellAddress = XLSX.utils.encode_cell({ r, c });
                                if (!ws[cellAddress]) ws[cellAddress] = {};
                                ws[cellAddress].s = dataStyle;
                            }
                        }

                        ws['!cols'] = [
                            { wch: 20 },
                            { wch: 15 },
                            { wch: 15 },
                            { wch: 15 },
                            { wch: 20 },
                            { wch: 20 }
                        ];

                        // Adiciona a planilha ao workbook com o nome do representante
                        XLSX.utils.book_append_sheet(wb, ws, `Representante_${rep.nome}`);
                    });
            });

            // Espera todas as promessas de busca serem concluídas
            Promise.all(fetchPromises)
                .then(() => {
                    // Gera o arquivo e força o download
                    XLSX.writeFile(wb, 'relatorio_representantes.xlsx'); 
                })
                .catch(error => console.error('Error fetching pieces data for all representatives:', error));
        })
        .catch(error => console.error('Error fetching representatives data:', error));
}

