$(document).ready(function () {
    let representanteIdSelecionado = null;
    let associadoId = null; // Variável para armazenar o associado

    $('#representante').append('<option value="" disabled selected>Selecione um representante</option>');

    // Evento para selecionar um representante
    $('#representante').on('change', function () {
        representanteIdSelecionado = $(this).val();

        if (representanteIdSelecionado) {
            $.ajax({
                url: `/api/associado/${representanteIdSelecionado}`, // Endpoint para obter o associado
                method: 'GET',
                success: function (data) {
                    associadoId = data.associado; // Armazena o ID do associado
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error('Erro ao buscar associado:', textStatus, errorThrown);
                }
            });
        }
    });

    // Evento para enviar o formulário
    $('#form-registro').on('submit', function (event) {
        event.preventDefault(); // Evita a submissão padrão do formulário

        if (!representanteIdSelecionado) {
            alert('Por favor, selecione um representante.');
            return;
        }

        // Coletar os valores dos campos
        const representante_id = representanteIdSelecionado;
        const data = $('#data').val();
        const hora = $('#hora').val();
        const comprador = $('#comprador').val();
        const valor_debito = unformatCurrency($('#valor_debito').val());
        const valor_credito = unformatCurrency($('#valor_credito').val());
        const pagamento = $('#pagamento').val();
        const observacoes = $('#observacoes').val();

        // Validar dados
        if (!representante_id || !data || !comprador || isNaN(valor_debito) || isNaN(valor_credito)) {
            alert('Por favor, preencha todos os campos corretamente.');
            return;
        }

        // Mapeamento ID para Nome do pagamento
        const pagamentoNome = $('#pagamento option:selected').text();

        // Enviar dados para o servidor
        $.ajax({
            url: '/api/registros_financeiros',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                representante_id,
                data,
                hora,
                comprador,
                valor_debito,
                valor_credito,
                pagamento: pagamentoNome,
                observacoes,
                associado: associadoId // Inclui o associado no payload
            }),
            success: function (response) {
                alert('Registro financeiro salvo com sucesso!');
                $('#form-registro')[0].reset();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Erro ao salvar o registro financeiro:', textStatus, errorThrown);
                alert('Erro ao salvar o registro financeiro.');
            }
        });
    });

    // Inicializar Cleave.js para os campos de valor
    new Cleave('#valor_debito', {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalMark: ',',
        delimiter: '.',
        prefix: 'R$ ',
        numeralDecimalScale: 2
    });

    new Cleave('#valor_credito', {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalMark: ',',
        delimiter: '.',
        prefix: 'R$ ',
        numeralDecimalScale: 2
    });

    function formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }


    function unformatCurrency(value) {
        // Remove R$ e separadores de milhar, e substitui a vírgula por ponto para a conversão correta
        return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')).toFixed(4) || '0.0000';
    }

    function loadRegistros(representanteId) {
        $('#loading-screen').show();

        $.get('/api/registros_financeiros', { representante_id: representanteId }, function (data) {
            $('#tabela-registros-modal tbody').empty();
            let totalDebitos = 0;
            let totalCreditos = 0;

            data.forEach(reg => {
                let rowClass = '';
                const valorDebito = unformatCurrency(reg.valor_debito) / 100;
                const valorCredito = unformatCurrency(reg.valor_credito) / 100;

                if (valorDebito > 0) {
                    rowClass = 'bg-debito';
                } else if (valorCredito > 0) {
                    rowClass = 'bg-credito';
                }

                const horaFormatada = reg.hora ? reg.hora : '';
                const pagamentoNome = reg.pagamento ? reg.pagamento : ''; // Exibindo diretamente o nome do pagamento
                const observacoesFormatadas = reg.observacoes ? reg.observacoes : '';

                $('#tabela-registros-modal tbody').append(
                    `<tr class="${rowClass}" data-id="${reg.id}" data-representante-id="${representanteId}">
                        <td class="editable">${formatDate(reg.data)}</td>
                        <td class="editable">${horaFormatada}</td>
                        <td class="editable">${reg.comprador ? reg.comprador : ''}</td>
                        <td class="editable">${formatCurrency(valorDebito)}</td>
                        <td class="editable">${formatCurrency(valorCredito)}</td>
                        <td class="editable">${pagamentoNome}</td>
                        <td class="editable">${observacoesFormatadas}</td>
                        <td>
                            <div class="btn-group">
                                <!-- Botão Editar com ícone -->
                                <button class="btn btn-primary btn-sm edit-btn">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <!-- Botão Excluir com ícone de lixeira -->
                                <button class="btn btn-danger btn-sm" onclick="deleteRegistro(${reg.id})">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </td>
                    </tr>`
                );


                totalDebitos += valorDebito;
                totalCreditos += valorCredito;
            });

            $('#total-debitos').text(formatCurrency(totalDebitos)).css('color', 'red');
            $('#total-creditos').text(formatCurrency(totalCreditos)).css('color', 'blue');

            let saldo = totalCreditos - totalDebitos;
            $('#saldo').text(formatCurrency(saldo)).css('color', saldo < 0 ? 'red' : 'blue');

            $('#loading-screen').hide();
            $('#modalRegistrosFinanceiros').modal('show');

            $('.edit-btn').click(function () {
                const tr = $(this).closest('tr');
                toggleEditMode(tr);
            });
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar registros financeiros:', textStatus, errorThrown);
            $('#loading-screen').hide();
        });
    }

    function toggleEditMode(tr) {
        const isEditing = tr.hasClass('editing');

        if (isEditing) {
            const representanteIdOriginal = tr.data('representante-id');
            const data = formatDateToSQL(tr.find('td:eq(0) input').val());
            const hora = tr.find('td:eq(1) input').val();
            const comprador = tr.find('td:eq(2) input').val();
            const valor_debito = unformatCurrency(tr.find('td:eq(3) input').val());
            const valor_credito = unformatCurrency(tr.find('td:eq(4) input').val());
            const pagamentoId = tr.find('td:eq(5) select').val();
            const observacoes = tr.find('td:eq(6) input').val();

            // Verificar se os valores são válidos e não são undefined
            if (!representanteIdOriginal || !data || !hora || !comprador || isNaN(valor_debito) || isNaN(valor_credito) || !pagamentoId) {
                alert('Por favor, preencha todos os campos corretamente.');
                return;
            }

            // Mapear ID para Nome do Tipo de Pagamento
            let pagamentoNome = "";
            const options = tr.find('td:eq(5) select option');
            options.each(function () {
                if ($(this).val() === pagamentoId) {
                    pagamentoNome = $(this).text();
                }
            });

            $.ajax({
                url: `/api/registros_financeiros/${tr.data('id')}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    representante_id: representanteIdOriginal,
                    data,
                    hora,
                    comprador,
                    valor_debito,
                    valor_credito,
                    pagamento: pagamentoNome, // Enviar nome em vez de ID
                    observacoes
                }),
                success: function () {
                    // Atualizar a célula com o nome do tipo de pagamento
                    tr.find('td:eq(5)').text(pagamentoNome); // Definir o texto da célula como o nome do pagamento

                    tr.find('td.editable').each(function () {
                        const input = $(this).find('input');
                        $(this).text(input.val());
                    });
                    tr.removeClass('editing');
                    tr.find('.edit-btn').text('Editar');
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error('Erro ao salvar registro financeiro:', textStatus, errorThrown);
                    alert('Erro ao salvar o registro financeiro.');
                }
            });
        } else {
            // Exibir o select com os tipos de pagamento disponíveis
            $.ajax({
                url: '/api/tipo_pagamento',
                method: 'GET',
                success: function (data) {
                    const select = tr.find('td:eq(5)'); // Ajuste o índice conforme necessário
                    const currentValue = select.text().trim(); // Obtenha o valor atual e remova espaços em branco

                    // Cria o select com as opções
                    let options = '<select class="form-control form-control-sm">';
                    data.forEach(item => {
                        options += `<option value="${item.id}" ${item.tipo_pagamento === currentValue ? 'selected' : ''}>${item.tipo_pagamento}</option>`;
                    });
                    options += '</select>';

                    // Substitua o conteúdo da célula pelo select
                    select.html(options);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    console.error('Erro ao carregar tipos de pagamento:', textStatus, errorThrown);
                    alert('Erro ao carregar tipos de pagamento.');
                }
            });

            // Atualiza outros campos como inputs
            tr.find('td.editable').each(function (index) {
                const text = $(this).text();
                if (index !== 5) { // Exclua o campo pagamento
                    $(this).html(`<input type="text" class="form-control form-control-sm" value="${text}">`);
                }
            });
            tr.addClass('editing');
            tr.find('.edit-btn').text('Salvar');
        }
    }

    function loadRepresentantes() {
        $.get('/api/representantes_financeiros', function (data) {
            // Ordenar os representantes por nome em ordem alfabética
            data.sort((a, b) => a.nome.localeCompare(b.nome));

            $('#representantes-container').empty();
            $('#representante').empty();
            $('#tabela-representantes tbody').empty();
            $('#representante').append('<option value="" disabled selected>Selecione um representante</option>'); // Re-adiciona a opção padrão

            var container = $('<div class="row"></div>');

            data.forEach((rep, index) => {
                $('#representante').append(`<option value="${rep.id}">${rep.nome}</option>`);
                $('#tabela-representantes tbody').append(`<tr><td>${rep.id}</td><td>${rep.nome}</td></tr>`);

                if (index % 4 === 0 && index !== 0) {
                    $('#representantes-container').append(container);
                    container = $('<div class="row"></div>');
                }

                container.append(
                    `<div class="col-md-3 mb-2">
                        <button class="btn btn-primary btn-lg btn-registros" data-id="${rep.id}" data-nome="${rep.nome}">${rep.nome}</button>
                    </div>`
                );
            });

            if (container.children().length > 0) {
                $('#representantes-container').append(container);
            }

            $('.btn-registros').on('click', function () {
                representanteIdSelecionado = $(this).data('id');
                var representanteNome = $(this).data('nome');
                $('#modal-representante-nome').text(representanteNome);
                loadRegistros(representanteIdSelecionado);
            });

            $('#tabela-representantes').DataTable();
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar representantes financeiros:', textStatus, errorThrown);
        });
    }

    // Inicializar
    loadRepresentantes();

    // Adicionar representante financeiro
    $('#form-add-representante').on('submit', function (event) {
        event.preventDefault();
        const nome = $('#nome_representante').val();

        if (!nome) {
            alert('Por favor, insira o nome do representante.');
            return;
        }

        $.ajax({
            url: '/api/representantes_financeiros',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ nome }),
            success: function () {
                $('#nome_representante').val('');
                loadRepresentantes();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Erro ao adicionar representante financeiro:', textStatus, errorThrown);
            }
        });
    });
    $(document).ready(function () {
        // Função para excluir registro financeiro
        function deleteRegistro(id) {
            if (confirm('Tem certeza que deseja excluir este registro?')) {
                $.ajax({
                    url: `/api/registros_financeiros/${id}`,
                    method: 'DELETE',
                    success: function () {
                        // Remover a linha da tabela
                        $(`tr[data-id="${id}"]`).remove();
                        alert('Registro excluído com sucesso.');
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.error('Erro ao excluir registro financeiro:', textStatus, errorThrown);
                        alert('Erro ao excluir registro financeiro.');
                    }
                });
            }
        }

        // Adicionar evento de clique para os botões de exclusão
        $('#tabela-registros-modal').on('click', '.btn-danger', function () {
            const id = $(this).closest('tr').data('id');
            deleteRegistro(id);
        });

    });
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
    function formatDateToSQL(dateStr) {
        // Assume que dateStr está no formato DD/MM/YYYY
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parts[0];
            const month = parts[1];
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        return null;
    }


    // Adicionar representante financeiro
    $('#form-representante').on('submit', function (event) {
        event.preventDefault();
        const nome = $('#nome').val();
        const associado = $('#associado').val(); // Obtém o valor selecionado

        if (!nome) {
            alert('Por favor, insira o nome do representante.');
            return;
        }

        $.ajax({
            url: '/api/representantes_financeiros',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ nome, associado }),
            success: function () {
                $('#nome').val('');
                $('#associado').val('');
                loadRepresentantes();
                $('#modalRepresentante').modal('hide'); // Fechar o modal     
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error('Erro ao adicionar representante financeiro:', textStatus, errorThrown);
            }
        });
    });

});

document.getElementById('search-input').addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const tableRows = document.querySelectorAll('#tabela-registros-modal tbody tr');

    tableRows.forEach(row => {
        const rowText = row.textContent.toLowerCase();
        if (rowText.includes(searchTerm)) {
            row.style.display = ''; // Mostra a linha
        } else {
            row.style.display = 'none'; // Esconde a linha
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('search-input');
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');

    const filterTable = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
        const tableRows = document.querySelectorAll('#tabela-registros-modal tbody tr');

        tableRows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            const dateCell = row.querySelector('td:first-child'); // Assume que a data está na primeira coluna

            // Verifica se a célula da data existe e obtém seu texto
            if (dateCell) {
                const dateText = dateCell.textContent.trim();

                // Converte a data da célula para o formato YYYY-MM-DD
                const [day, month, year] = dateText.split('/');
                const rowDate = new Date(`${year}-${month}-${day}`);

                // Verifica se a data da célula é válida
                const isValidDate = !isNaN(rowDate.getTime());

                const matchesSearch = rowText.includes(searchTerm);
                const withinDateRange = (
                    (startDate === null || isValidDate && rowDate >= startDate) &&
                    (endDate === null || isValidDate && rowDate <= endDate)
                );

                if (matchesSearch && withinDateRange) {
                    row.style.display = ''; // Mostra a linha
                } else {
                    row.style.display = 'none'; // Esconde a linha
                }
            }
        });
    };

    searchInput.addEventListener('input', filterTable);
    startDateInput.addEventListener('change', filterTable);
    endDateInput.addEventListener('change', filterTable);
});



$(document).ready(function () {
    // Função para gerar PDF
    $('#form-gerar-pdf').on('submit', function (event) {
        event.preventDefault(); // Impede o comportamento padrão de envio do formulário

        const representanteId = $('#representante_pdf').val();
        const dataInicio = $('#data_inicio').val();
        const dataFim = $('#data_fim').val();

        if (!representanteId || !dataInicio || !dataFim) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Chama o novo endpoint para obter os dados filtrados
        $.get('/api/registros_financeiros_para_pdf', { representante_id: representanteId, data_inicio: dataInicio, data_fim: dataFim }, function (data) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape' }); // Horizontal

            // Adicionar a imagem ao PDF
            const imageUrl = '/login/photo/untitled (1).png';
            const image = new Image();
            image.src = imageUrl;
            image.onload = function () {
                // Adicionar a imagem no canto esquerdo
                doc.addImage(image, 'PNG', 10, 10, 30, 20); // x, y, largura, altura

                doc.setFontSize(14);
                doc.setFont("helvetica", "bold"); // Define a fonte como Helvetica em negrito
                doc.text('Relatório de Movimentação', 44, 16);


                // Adicionar informações do representante e período
                doc.setFontSize(12);
                const representanteNome = $('#representante_pdf option:selected').text();
                const formattedDataInicio = formatDateToBR(dataInicio);
                const formattedDataFim = formatDateToBR(dataFim);

                console.log('Representante:', representanteNome);
                console.log('Período:', formattedDataInicio, '-', formattedDataFim);

                doc.text(`Representante: ${representanteNome}`, 130, 16);
                doc.text(`Período: ${formattedDataInicio} - ${formattedDataFim}`, 44, 24);


                // Definir posições e largura para a tabela
                let y = 40; // Y inicial para a tabela
                const colWidths = [20, 20, 60, 30, 30, 30, 90]; // Largura das colunas
                const columns = ['Data', 'Hora', 'Comprador', 'Débito', 'Crédito', 'Pagamento', 'Observações'];

                // Adicionar cabeçalho da tabela
                doc.setFillColor(255, 255, 255); // Cor de fundo branca
                const headerHeight = 10;
                const headerX = 14;
                const headerWidth = colWidths.reduce((a, b) => a + b, 0); // Largura do cabeçalho igual à soma das larguras das colunas
                doc.rect(headerX, y - headerHeight, headerWidth, headerHeight, 'F');
                doc.setFontSize(10);
                columns.forEach((col, index) => {
                    doc.text(col, headerX + colWidths.slice(0, index).reduce((a, b) => a + b, 0) + 2, y - 2); // Adiciona um ajuste de 2 unidades para espaçamento
                });

                y += headerHeight; // Espaço abaixo do cabeçalho

                // Variáveis para totais
                let totalDebitos = 0;
                let totalCreditos = 0;

                // Número de linhas por página para a primeira página e para as demais
                const linesPerPageFirstPage = 18; // Número de linhas na primeira página
                const linesPerPageOtherPages = 23; // Número de linhas nas demais páginas
                let isFirstPage = true; // Variável para rastrear se estamos na primeira página

                // Função para verificar e adicionar uma nova página se necessário
                function checkAddPage(doc, y, currentPageLines) {
                    const linesPerPage = isFirstPage ? linesPerPageFirstPage : linesPerPageOtherPages;

                    if (currentPageLines >= linesPerPage) {
                        doc.addPage();
                        y = 10; // Margem superior da nova página
                        currentPageLines = 0; // Reiniciar contagem de linhas
                        isFirstPage = false; // Após a primeira página, todas são páginas subsequentes
                    }

                    return { y, currentPageLines };
                }

                // Inicializar contadores
                let currentPageLines = 0;
                const rectHeight = 8; // Altura do retângulo menor
                const rectPadding = 2; // Padding para reduzir a largura
                const textOffset = 2; // Ajuste a posição do texto para cima
                const extraLeftSpace = 10; // Espaço extra à esquerda do retângulo

                data.forEach((reg, index) => {
                    // Verificar e adicionar uma nova página se necessário
                    const result = checkAddPage(doc, y, currentPageLines);
                    y = result.y;
                    currentPageLines = result.currentPageLines;

                    // Definir a cor de fundo da linha
                    if (index % 2 === 0) {
                        doc.setFillColor(220, 220, 220); // Cinza claro
                    } else {
                        doc.setFillColor(255, 255, 255); // Branco
                    }

                    // Definir o texto seguro (garante que valores nulos ou indefinidos não causem problemas)
                    const safeText = (value) => (value !== undefined && value !== null) ? value.toString() : '';

                    // Definir o texto do comprador
                    const compradorTexto = safeText(reg.comprador);

                    // Agora você pode definir 'compradorLinhas' corretamente antes de calcular a altura
                    const compradorLinhas = doc.splitTextToSize(compradorTexto, colWidths[2] - 2); // Quebra o texto em múltiplas linhas, se necessário

                    // Calcular a altura da linha com base no número de linhas do comprador
                    const linhaCompradorAltura = compradorLinhas.length * 8; // Cada linha tem 8 de altura

                    // Desenhar o retângulo de fundo para a linha com largura e altura ajustadas
                    const rectHeightAdjusted = Math.max(rectHeight, linhaCompradorAltura);
                    const x = headerX - extraLeftSpace; // Ajuste a posição X para mais espaço à esquerda
                    const rectWidth = headerWidth + extraLeftSpace - rectPadding;
                    doc.rect(x, y - rectHeight, rectWidth, rectHeightAdjusted, 'F');

                    // Adicionar o texto para cada coluna
                    doc.setFont("helvetica", "normal");
                    doc.setFontSize(8); // Tamanho padrão da fonte
                    doc.setTextColor(0, 0, 0); // Cor do texto preta

                    // Ajustar a posição do texto para cima
                    const textY = y - textOffset;

                    // Adicionar o texto da data e hora
                    doc.text(formatDate(reg.data), headerX, textY);
                    doc.text(safeText(reg.hora || ''), headerX + colWidths[0], textY); // Verificar se "hora" está vazio

                    // Adicionar o texto do comprador (com múltiplas linhas, se necessário)
                    compradorLinhas.forEach((linha, linhaIndex) => {
                        doc.text(linha, headerX + colWidths[0] + colWidths[1], textY + (linhaIndex * 8)); // Adiciona cada linha com espaçamento vertical
                    });

                    // Adicionar os valores de débito e crédito
                    const valorDebito = unformatCurrency(reg.valor_debito) / 100;
                    const valorCredito = unformatCurrency(reg.valor_credito) / 100;

                    doc.text(formatCurrency(valorDebito), headerX + colWidths[0] + colWidths[1] + colWidths[2], textY);
                    doc.text(formatCurrency(valorCredito), headerX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], textY);

                    // Ajustar a posição da coluna "pagamento"
                    doc.text(safeText(reg.pagamento || ''), headerX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], textY);

                    // Ajustar texto da coluna de observações (com quebra de linhas, se necessário)
                    if (safeText(reg.observacoes).length > 100) {
                        doc.setFontSize(8); // Reduzir o tamanho da fonte
                        const obsText = doc.splitTextToSize(safeText(reg.observacoes), colWidths[6]);
                        obsText.forEach((line, lineIndex) => {
                            doc.text(line, headerX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], textY + (lineIndex * 8)); // Espaço entre linhas
                        });
                        y += (obsText.length * 8); // Ajusta a altura de acordo com o número de linhas
                    } else {
                        doc.setFontSize(10); // Tamanho padrão da fonte
                        doc.text(safeText(reg.observacoes), headerX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], textY);
                    }

                    // Atualizar totais
                    totalDebitos += valorDebito;
                    totalCreditos += valorCredito;

                    // Incrementar o contador de linhas e a posição Y
                    currentPageLines++;
                    y += rectHeightAdjusted; // Aumenta Y com base na altura ajustada da célula
                });

                // Adicionar linha de totais
                doc.setFontSize(10);

                // Altura necessária para as linhas de totais (3 linhas: débitos, créditos, saldo)
                const totalLinesHeight = 24;

                // Verificar se há espaço suficiente na página atual para os totais
                const pageHeight = doc.internal.pageSize.getHeight();
                if (y + totalLinesHeight > pageHeight - 20) { // 20 para margem inferior
                    doc.addPage(); // Adicionar nova página se não houver espaço
                    y = 20; // Reiniciar a posição y para a nova página
                }

                // Agora, adicionar os totais
                const totalsRowY = y;

                // Largura total da página e margem
                const pageWidth = doc.internal.pageSize.getWidth();
                const marginRight = 14; // Margem direita (ajuste conforme necessário)

                // Definir cor do saldo com base no valor
                const saldo = totalCreditos - totalDebitos; // Inicializa a variável saldo

                // Calculando a posição X para alinhar à direita
                const textDebitos = 'Débitos:';
                const textCreditos = 'Créditos:';
                const textSaldo = 'Saldo:';

                // Estimando a largura dos textos
                const widthDebitos = doc.getTextWidth(textDebitos + formatCurrency(totalDebitos));
                const widthCreditos = doc.getTextWidth(textCreditos + formatCurrency(totalCreditos));
                const widthSaldo = doc.getTextWidth(textSaldo + formatCurrency(saldo));

                // Posição X para alinhar à direita
                const xRightDebitos = pageWidth - widthDebitos - marginRight;
                const xRightCreditos = pageWidth - widthCreditos - marginRight;
                const xRightSaldo = pageWidth - widthSaldo - marginRight;

                // Adicionar totais de débitos em vermelho
                doc.setTextColor(255, 0, 0); // Cor vermelha para débitos
                doc.text(textDebitos, xRightDebitos, totalsRowY + 8);
                doc.text(formatCurrency(totalDebitos), xRightDebitos + doc.getTextWidth(textDebitos), totalsRowY + 8);

                // Adicionar totais de créditos em azul
                doc.setTextColor(0, 0, 255); // Cor azul para créditos
                doc.text(textCreditos, xRightCreditos, totalsRowY + 16);
                doc.text(formatCurrency(totalCreditos), xRightCreditos + doc.getTextWidth(textCreditos), totalsRowY + 16);

                // Definir a cor para o saldo após calcular
                if (saldo >= 0) {
                    doc.setTextColor(0, 0, 255); // Azul para saldo positivo
                } else {
                    doc.setTextColor(255, 0, 0); // Vermelho para saldo negativo
                }
                doc.text(textSaldo, xRightSaldo, totalsRowY + 24);
                doc.text(formatCurrency(saldo), xRightSaldo + doc.getTextWidth(textSaldo), totalsRowY + 24);

                // Resetar a cor para o padrão após adicionar o saldo
                doc.setTextColor(0, 0, 0);


                // Salvar o PDF
                doc.save(`relatorio_financeiro_${representanteId}_${dataInicio}_a_${dataFim}.pdf`);
            };
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Erro ao gerar PDF:', textStatus, errorThrown);
            alert('Erro ao gerar PDF.');
        });
    });



    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    function formatCurrency(value) {
        let number = parseFloat(value).toFixed(2);
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(number);
    }

    function unformatCurrency(value) {
        return parseFloat(value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(/,/g, '.')) || 0;
    }

    function loadRepresentantesForPdf() {
        $.get('/api/representantes_financeiros', function (data) {
            // Ordenar os representantes por nome em ordem alfabética
            data.sort((a, b) => a.nome.localeCompare(b.nome));

            $('#representante_pdf').empty();

            // Adicionar a opção padrão se necessário
            $('#representante_pdf').append('<option value="" disabled selected>Selecione um representante</option>');

            // Adicionar as opções ordenadas ao dropdown
            data.forEach(rep => {
                $('#representante_pdf').append(`<option value="${rep.id}">${rep.nome}</option>`);
            });
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar representantes para PDF:', textStatus, errorThrown);
        });
    }

    function formatDateToBR(dateString) {
        // dateString deve estar no formato "YYYY-MM-DD"
        const [year, month, day] = dateString.split('-');
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }



    // Inicializar representantes no formulário PDF
    loadRepresentantesForPdf();
});

document.addEventListener('DOMContentLoaded', function () {
    // Função para remover formatação de CPF/CNPJ
    function removerFormatacaoCpfCnpj(valor) {
        return valor.replace(/[^\d]+/g, ''); // Remove qualquer caractere que não seja número
    }

    // Preencher o select com representantes financeiros
    const select = document.getElementById('representante_select');
    const defaultOption = document.createElement('option');
    defaultOption.value = ''; // Valor vazio
    defaultOption.textContent = 'Selecione um representante'; // Texto da opção padrão
    defaultOption.selected = true; // Torna esta opção a selecionada por padrão
    defaultOption.disabled = true; // Impede que esta opção seja selecionada novamente
    select.appendChild(defaultOption);

    fetch('/api/representantes_financeiros')
        .then(response => response.json())
        .then(data => {
            data.forEach(representante => {
                const option = document.createElement('option');
                option.value = representante.id;
                option.textContent = representante.nome;
                select.appendChild(option);
            });
        });

    // Adicionar máscara de CPF/CNPJ
    $('#cpf_cnpj').inputmask({
        mask: ['999.999.999-99', '99.999.999/9999-99'],
        placeholder: ' ',
        clearIncomplete: true // Limpa entradas incompletas
    });

    // Enviar o formulário ao servidor
    document.getElementById('formCadastroComprador').addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Captura o CPF/CNPJ
        const cpfCnpj = removerFormatacaoCpfCnpj(document.getElementById('cpf_cnpj').value); // Limpa a formatação
        data.cpf_cnpj = cpfCnpj; // Adiciona ao objeto data o valor sem formatação

        // Verificar duplicidade no frontend
        fetch(`/api/verificar_comprador?cpf_cnpj=${encodeURIComponent(cpfCnpj)}&representante_id=${data.representante_id}`)
            .then(response => {
                if (response.ok) {
                    // Se não houver duplicidade, envia os dados
                    return fetch('/api/compradores', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    });
                } else {
                    throw new Error('Comprador já cadastrado com o mesmo CPF/CNPJ e representante.');
                }
            })
            .then(response => {
                if (response.ok) {
                    alert('Comprador cadastrado com sucesso!');
                    $('#modalCadastroComprador').modal('hide');

                    // Limpar os campos do formulário
                    this.reset();
                    select.selectedIndex = 0;
                } else {
                    alert('Erro ao cadastrar comprador');
                }
            })
            .catch(error => {
                alert(error.message); // Mostra a mensagem de erro
                console.error('Erro:', error);
            });
    });
});


document.addEventListener('DOMContentLoaded', function () {
    const representanteSelect = document.getElementById('representante');
    const compradorSelect = document.getElementById('comprador');
    const form = document.getElementById('form-registro-financeiro'); // Assumindo que você tem um formulário com este ID

    // Função para carregar compradores associados ao representante selecionado
    function carregarCompradores(representanteId) {
        fetch(`/api/compradores?representante_id=${representanteId}`)
            .then(response => response.json())
            .then(data => {
                compradorSelect.innerHTML = '<option value="">Selecione um comprador</option>';
                data.forEach(comprador => {
                    const option = document.createElement('option');
                    option.value = comprador.nome; // Aqui estamos usando o nome como valor
                    option.textContent = comprador.nome;
                    compradorSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Erro ao carregar compradores:', error);
            });
    }

    fetch('/api/representantes_financeiros')
        .then(response => response.json())
        .then(data => {
            data.forEach(representante => {
                const option = document.createElement('option');
                option.value = representante.id;
                option.textContent = representante.nome;
                representanteSelect.appendChild(option);
            });
        });

    representanteSelect.addEventListener('change', function () {
        const representanteId = this.value;
        if (representanteId) {
            carregarCompradores(representanteId);
        } else {
            compradorSelect.innerHTML = '<option value="">Selecione um comprador</option>';
        }
    });

    // Evento de envio do formulário
    form.addEventListener('submit', function (event) {
        event.preventDefault();

        const compradorNome = compradorSelect.value; // Captura o nome do comprador selecionado

        const formData = {
            representante_id: representanteSelect.value,
            comprador: compradorNome, // Envia o nome do comprador
            data: form.elements['data'].value,
            hora: form.elements['hora'].value,
            valor_debito: form.elements['valor_debito'].value,
            valor_credito: form.elements['valor_credito'].value,
            pagamento: form.elements['pagamento'].value,
            observacoes: form.elements['observacoes'].value
        };

        fetch('/api/registros_financeiros', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
            .then(response => response.json())
            .then(data => {
                console.log('Registro financeiro salvo com sucesso:', data);
            })
            .catch(error => {
                console.error('Erro ao salvar o registro financeiro:', error);
            });
    });
});


let tiposPagamento = [];

$(document).ready(function () {
    function carregarTiposPagamento() {
        $.get('/api/tipo_pagamento', function (data) {
            tiposPagamento = data;

            // Preenche o select com os tipos de pagamento
            const $pagamentoSelect = $('#pagamento');
            data.forEach(function (tipo) {
                $pagamentoSelect.append(
                    `<option value="${tipo.id}">${tipo.tipo_pagamento}</option>`
                );
            });
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar tipos de pagamento:', textStatus, errorThrown);
        });
    }

    carregarTiposPagamento();
});


// BAIXAR AQRUIVO EXCEL 
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString();
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function unformatCurrency(value) {
    return parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')).toFixed(4) || '0.0000';
}

function downloadExcel() {
    // Mostrar tela de carregamento
    $('#loading-screen').show();

    $.get('/api/registros_financeiros_todos', function (data) {
        // Criar um workbook novo
        const wb = XLSX.utils.book_new();

        // Agrupar registros por representante
        const representantes = {};

        data.forEach(reg => {
            if (!representantes[reg.representante_id]) {
                representantes[reg.representante_id] = {
                    nome: reg.representante_nome,
                    registros: []
                };
            }

            representantes[reg.representante_id].registros.push(reg);
        });

        // Adicionar uma aba para cada representante
        Object.keys(representantes).forEach(representanteId => {
            const rep = representantes[representanteId];
            const wsData = [];

            // Cabeçalho
            wsData.push(['Data', 'Hora', 'Comprador', 'Débito', 'Crédito', 'Pagamento', 'Observações', 'Total Crédito', 'Total Débito', 'Saldo']);

            let totalDebitos = 0;
            let totalCreditos = 0;

            // Adicionar registros
            rep.registros.forEach(reg => {
                const valorDebito = unformatCurrency(reg.valor_debito) / 100;
                const valorCredito = unformatCurrency(reg.valor_credito) / 100;

                wsData.push([
                    formatDate(reg.data),
                    reg.hora || '',
                    reg.comprador || '',
                    formatCurrency(valorDebito),
                    formatCurrency(valorCredito),
                    reg.pagamento || '',
                    reg.observacoes || '',
                    '', // Coluna H (Total Crédito - deixado em branco para a linha de totais)
                    '', // Coluna I (Total Débito - deixado em branco para a linha de totais)
                    ''  // Coluna J (Saldo - deixado em branco para a linha de totais)
                ]);

                totalDebitos += valorDebito;
                totalCreditos += valorCredito;
            });

            // Adicionar totais na linha específica
            // A linha 2 é a segunda linha no Excel (index 1)
            wsData[1][7] = formatCurrency(totalCreditos); // Total Crédito (H2)
            wsData[1][8] = formatCurrency(totalDebitos);   // Total Débito (I2)
            wsData[1][9] = formatCurrency(totalCreditos - totalDebitos); // Saldo (J2)

            // Criar uma nova aba para o representante
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Ajustar largura das colunas
            const colWidth = wsData[0].map((_, colIndex) => {
                return {
                    width: Math.max(...wsData.map(row => (row[colIndex] || '').toString().length))
                };
            });
            ws['!cols'] = colWidth;

            XLSX.utils.book_append_sheet(wb, ws, rep.nome);
        });

        // Gerar o arquivo Excel e iniciar o download
        XLSX.writeFile(wb, 'Registros_Financeiros.xlsx');

        // Esconder tela de carregamento
        $('#loading-screen').hide();
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error('Erro ao carregar registros financeiros:', textStatus, errorThrown);
        $('#loading-screen').hide();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/representantes_financeiros/saldos');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const representantes = await response.json();
        console.log('Dados dos representantes:', representantes);

        // Ordenar os representantes por nome em ordem alfabética
        representantes.sort((a, b) => a.nome.localeCompare(b.nome));

        // Selecionar o corpo da tabela
        const tableBody = document.querySelector('#representantes-table tbody');
        tableBody.innerHTML = ''; // Limpar qualquer conteúdo existente

        let totalDebito = 0;
        let totalCredito = 0;
        let totalSaldo = 0;

        // Iterar sobre os representantes e adicionar linhas à tabela
        representantes.forEach(rep => {
            const row = document.createElement('tr');

            // Coluna do nome do representante
            const nomeCell = document.createElement('td');
            nomeCell.textContent = rep.nome;
            row.appendChild(nomeCell);

            // Coluna do total de débito
            const debitoCell = document.createElement('td');
            const debitoValue = parseFloat(rep.total_debito) || 0;
            debitoCell.textContent = formatCurrency(debitoValue);
            row.appendChild(debitoCell);

            // Coluna do total de crédito
            const creditoCell = document.createElement('td');
            const creditoValue = parseFloat(rep.total_credito) || 0;
            creditoCell.textContent = formatCurrency(creditoValue);
            row.appendChild(creditoCell);

            // Coluna do saldo final
            const saldoCell = document.createElement('td');
            const saldoValue = parseFloat(rep.saldo) || 0;
            saldoCell.textContent = formatCurrency(saldoValue);

            // Adicionar classe baseada no valor do saldo
            if (saldoValue > 0) {
                saldoCell.classList.add('saldo-positivo');
            } else if (saldoValue < 0) {
                saldoCell.classList.add('saldo-negativo');
            }

            row.appendChild(saldoCell);

            tableBody.appendChild(row);

            // Acumulando totais
            totalDebito += debitoValue;
            totalCredito += creditoValue;
            totalSaldo += saldoValue;
        });

        // Adicionar linha de totais
        const totalRow = document.createElement('tr');
        totalRow.classList.add('total-row');
        const totalNomeCell = document.createElement('td');
        totalNomeCell.textContent = 'Total';
        totalNomeCell.colSpan = 1; // Ajuste conforme o número de colunas
        totalRow.appendChild(totalNomeCell);

        const totalDebitoCell = document.createElement('td');
        totalDebitoCell.textContent = formatCurrency(totalDebito);
        totalRow.appendChild(totalDebitoCell);

        const totalCreditoCell = document.createElement('td');
        totalCreditoCell.textContent = formatCurrency(totalCredito);
        totalRow.appendChild(totalCreditoCell);

        const totalSaldoCell = document.createElement('td');
        totalSaldoCell.textContent = formatCurrency(totalSaldo);

        // Adicionar classe baseada no valor do saldo total
        if (totalSaldo > 0) {
            totalSaldoCell.classList.add('saldo-positivo');
        } else if (totalSaldo < 0) {
            totalSaldoCell.classList.add('saldo-negativo');
        }

        totalRow.appendChild(totalSaldoCell);

        tableBody.appendChild(totalRow);

    } catch (error) {
        console.error('Erro ao buscar representantes:', error);
    }
});


// Função para formatar valores como moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Função para carregar representantes no select
function loadRepresentantes() {
    $.ajax({
        url: '/api/representantes',
        method: 'GET',
        success: function (data) {
            const $select = $('#associado');
            $select.empty(); // Limpa opções antigas

            $select.append(new Option('Selecione Um Representante', ''));
            // Adiciona a opção "Nenhum" no início da lista
            $select.append(new Option('Sem Associado', ''));

            // Itera sobre os dados e adiciona os representantes
            data.forEach(function (representante) {
                $select.append(new Option(representante.nome, representante.id));
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar representantes:', textStatus, errorThrown);
        }
    });
}


// Mostrar modal e carregar representantes
$('#modalRepresentante').on('show.bs.modal', function () {
    loadRepresentantes();
});

document.getElementById('form-gerar-pdf-diario').addEventListener('submit', function (event) {
    event.preventDefault();
    const dataSelecionada = document.getElementById('data_relatorio_diario').value;

    if (dataSelecionada) {
        fetch(`/api/registros_financeiros_por_data?data=${dataSelecionada}`)
            .then(response => response.json())
            .then(data => {
                console.log('Dados recebidos:', data);
                gerarPDF(data); // Função que vai gerar o PDF com os dados recebidos
            })
            .catch(error => {
                console.error('Erro ao buscar registros financeiros:', error);
            });
    }
});



async function gerarPDF(data) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Orientação paisagem

    // Verifique se autoTable está disponível
    if (typeof doc.autoTable !== 'function') {
        console.error('autoTable não está disponível. Certifique-se de que a biblioteca está corretamente incluída.');
        return;
    }

    // Função para formatar números como moeda real
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const columns = ['Data', 'Hora', 'Representante', 'Comprador', 'Débito', 'Crédito', 'Pagamento', 'Observações'];
    const rows = data.map(registro => [
        registro.data ? new Date(registro.data).toLocaleDateString() : '',  // Formatar a data se necessário
        registro.hora || '',
        registro.representante || '',  // Verificar se representante_id está presente
        registro.comprador || '',
        formatCurrency(parseFloat(registro.valor_debito) || 0),
        formatCurrency(parseFloat(registro.valor_credito) || 0),
        registro.pagamento || '',
        registro.observacoes || ''
    ]);

    // Adicionar título e data no topo do PDF
    const titulo = 'Relatório Movimentação Financeira';

    // Usar a data do primeiro registro (se existir) para "Data Movimentação"
    const dataMovimentacao = data.length > 0 && data[0].data ? new Date(data[0].data).toLocaleDateString('pt-BR') : 'Data Desconhecida';

    // Título no centro da página
    const pageWidthe = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    const tituloWidth = doc.getTextWidth(titulo);
    doc.text(titulo, (pageWidthe - tituloWidth) / 2, 10); // Alinhar o título ao centro no topo

    // Data de movimentação no canto direito superior
    doc.setFontSize(12);
    doc.text(`Data Movimentação: ${dataMovimentacao}`, pageWidthe - doc.getTextWidth(`Data Movimentação: ${dataMovimentacao}`) - 10, 10); // Data à direita


    // Adicionar a tabela ao PDF
    doc.autoTable({
        head: [columns],
        body: rows,
        startY: 20,
        theme: 'grid',
        headStyles: { fillColor: [22, 160, 133] }, // Cor de fundo dos cabeçalhos
        styles: { fontSize: 10 },
        margin: { horizontal: 10 },
        pageBreak: 'auto',
    });

    // Cálculo dos totais
    const totalDebitos = data.reduce((sum, registro) => sum + parseFloat(registro.valor_debito || 0), 0);
    const totalCreditos = data.reduce((sum, registro) => sum + parseFloat(registro.valor_credito || 0), 0);
    const saldo = totalDebitos - totalCreditos;

    // Adicionar totais ao final do PDF
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginRight = 10;
    const totalsRowY = doc.autoTable.previous.finalY + 10; // A posição Y da última linha da tabela

    // Função para calcular a largura do texto com a formatação
    const getTextWidth = (text) => {
        return doc.getTextWidth(text);
    };

    // Definir posição X fixa para alinhar os totais à direita
    const xRight = pageWidth - marginRight;

    // Ajustar tamanho da fonte para os totais
    const fontSize = 10; // Tamanho da fonte menor
    doc.setFontSize(fontSize);

    // Calcular as posições X para alinhar os totais à direita
    const textDebitos = `Débitos: ${formatCurrency(totalDebitos)}`;
    const textCreditos = `Créditos: ${formatCurrency(totalCreditos)}`;
    const textSaldo = `Saldo: ${formatCurrency(saldo)}`;

    // Larguras dos textos
    const widthDebitos = getTextWidth(textDebitos);
    const widthCreditos = getTextWidth(textCreditos);
    const widthSaldo = getTextWidth(textSaldo);

    // Adicionar totais ao PDF
    // Adicionar totais de débitos em vermelho
    doc.setTextColor(255, 0, 0); // Cor vermelha para débitos
    doc.text(textDebitos, xRight - widthDebitos, totalsRowY + 8);

    // Adicionar totais de créditos em azul
    doc.setTextColor(0, 0, 255); // Cor azul para créditos
    doc.text(textCreditos, xRight - widthCreditos, totalsRowY + 16);

    // Definir a cor para o saldo
    doc.setFontSize(fontSize); // Aplicar tamanho da fonte menor
    if (totalDebitos > totalCreditos) {
        doc.setTextColor(255, 0, 0); // Vermelho para saldo negativo
    } else {
        doc.setTextColor(0, 0, 255); // Azul para saldo positivo
    }
    doc.text(textSaldo, xRight - widthSaldo, totalsRowY + 24);

    // Resetar a cor para o padrão após adicionar o saldo
    doc.setTextColor(0, 0, 0);

    // Baixar o PDF
    doc.save('relatorio_diario.pdf');
}

// Edição Representantes
document.addEventListener('DOMContentLoaded', function () {
    const editRepresentantesSelect = document.getElementById('editRepresentantesSelect');

    // Função para carregar representantes no modal
    function carregarRepresentantes() {
        fetch('/api/representantes_financeiros')
            .then(response => response.json())
            .then(data => {
                editRepresentantesSelect.innerHTML = '<option value="">Selecione um representante</option>';
                data.forEach(representante => {
                    const option = document.createElement('option');
                    option.value = representante.id;
                    option.textContent = representante.nome;
                    editRepresentantesSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Erro ao carregar representantes:', error);
            });
    }

    // Evento para abrir o modal e carregar representantes
    const editRepresentantesModal = new bootstrap.Modal(document.getElementById('editRepresentantesModal'));

    document.querySelector('[data-bs-toggle="modal"][data-bs-target="#editRepresentantesModal"]').addEventListener('click', function () {
        carregarRepresentantes();
        editRepresentantesModal.show();
    });

    // Evento para carregar compradores quando o representante é selecionado
    editRepresentantesSelect.addEventListener('change', function () {
        const representanteId = this.value;
        if (representanteId) {
            carregarCompradores(representanteId);
        } else {
            document.getElementById('compradoresTableBody').innerHTML = '<tr><td colspan="2">Selecione um representante</td></tr>';
        }
    });
});
// Adicione a máscara de CPF/CNPJ ao campo de entrada
function aplicarMascaraCpfCnpj(input) {
    $(input).inputmask({
        mask: ['999.999.999-99', '99.999.999/9999-99'],
        placeholder: ' ',
        clearIncomplete: true
    });
}
// Função para formatar CPF ou CNPJ para exibição
function formatarCpfCnpj(valor) {
    if (valor.length === 11) {
        // Formatar como CPF
        return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else if (valor.length === 14) {
        // Formatar como CNPJ
        return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return valor; // Caso não tenha o tamanho esperado, retorna como está
}



function carregarCompradores(representanteId) {
    fetch(`/api/compradores?representante_id=${representanteId}`)
        .then(response => response.json())
        .then(data => {
            const compradoresTableBody = document.getElementById('compradoresTableBody');
            compradoresTableBody.innerHTML = '';

            if (data.length === 0) {
                const emptyRow = document.createElement('tr');
                emptyRow.innerHTML = '<td colspan="3">Nenhum comprador encontrado</td>';
                compradoresTableBody.appendChild(emptyRow);
            } else {
                data.forEach(comprador => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            <span class="comprador-nome">${comprador.nome}</span>
                            <input type="text" class="edit-input" value="${comprador.nome}" style="display: none;" />
                        </td>
                        <td>
                            <span class="comprador-cpf">${formatarCpfCnpj(comprador.cpf_cnpj)}</span>
                            <input type="text" class="edit-cpf-input" value="${comprador.cpf_cnpj}" style="display: none;" />
                        </td>
                        <td>
                            <div class="d-flex justify-content-end">
                                <button class="btn btn-primary btn-sm btn-editar me-2">Editar</button>
                                <button class="btn btn-danger btn-sm btn-excluir">Excluir</button>
                            </div>
                        </td>
                    `;
                    compradoresTableBody.appendChild(row);

                    const btnEditar = row.querySelector('.btn-editar');
                    const btnExcluir = row.querySelector('.btn-excluir');
                    const compradorNome = row.querySelector('.comprador-nome');
                    const inputEditar = row.querySelector('.edit-input');
                    const compradorCpf = row.querySelector('.comprador-cpf');
                    const inputEditarCpf = row.querySelector('.edit-cpf-input');

                    // Aplicar a máscara ao CPF/CNPJ durante a edição
                    aplicarMascaraCpfCnpj(inputEditarCpf);

                    btnEditar.addEventListener('click', function () {
                        if (btnEditar.textContent === 'Editar') {
                            compradorNome.style.display = 'none';
                            compradorCpf.style.display = 'none';
                            inputEditar.style.display = 'inline-block';
                            inputEditarCpf.style.display = 'inline-block';
                            btnEditar.textContent = 'Salvar';
                        } else {
                            const novoNome = inputEditar.value;
                            const novoCpf = inputEditarCpf.value;
                            editarComprador(comprador.id, novoNome, novoCpf, compradorNome, compradorCpf, inputEditar, inputEditarCpf, btnEditar);
                        }
                    });

                    btnExcluir.addEventListener('click', function () {
                        excluirComprador(comprador.id, row);
                    });
                });
                adicionarFuncaoPesquisa();
            }
        })
        .catch(error => {
            console.error('Erro ao carregar compradores:', error);
        });
}

// Função para adicionar a funcionalidade de pesquisa
function adicionarFuncaoPesquisa() {
    const searchInput = document.getElementById('searchCompradores');
    searchInput.addEventListener('input', function () {
        const filter = this.value.toLowerCase();
        const rows = document.querySelectorAll('#compradoresTableBody tr');

        rows.forEach(row => {
            const compradorNome = row.querySelector('.comprador-nome').textContent.toLowerCase();
            row.style.display = compradorNome.includes(filter) ? '' : 'none'; // Mostrar/ocultar linhas
        });
    });
}

function removerFormatacaoCpfCnpj(valor) {
    return valor.replace(/[^\d]+/g, ''); // Remove qualquer caractere que não seja número
}

function editarComprador(compradorId, novoNome, novoCpf, compradorNomeElem, compradorCpfElem, inputEditarElem, inputEditarCpfElem, btnEditarElem) {
    // Remover a formatação do CPF/CNPJ
    const cpfCnpjLimpo = removerFormatacaoCpfCnpj(novoCpf);

    fetch(`/api/compradores/${compradorId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nome: novoNome, cpf_cnpj: cpfCnpjLimpo }) // Enviar o valor sem formatação
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                compradorNomeElem.textContent = novoNome;
                compradorNomeElem.style.display = 'inline-block';
                compradorCpfElem.textContent = novoCpf; // Exibir o CPF/CNPJ com formatação no frontend
                compradorCpfElem.style.display = 'inline-block';

                inputEditarElem.style.display = 'none';
                inputEditarCpfElem.style.display = 'none';

                btnEditarElem.textContent = 'Editar';
            } else {
                alert('Erro ao salvar os dados do comprador.');
            }
        })
        .catch(error => {
            console.error('Erro ao editar comprador:', error);
        });
}


function excluirComprador(compradorId, rowElement) {
    if (confirm('Tem certeza que deseja excluir este comprador?')) {
        fetch(`/api/compradores/${compradorId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    rowElement.remove(); // Remove a linha da tabela
                } else {
                    alert('Erro ao excluir o comprador.');
                }
            })
            .catch(error => {
                console.error('Erro ao excluir comprador:', error);
            });
    }
}
//gambiarra para fechar corretamente o modal de edição de representantes
$('#editRepresentantesModal').on('hidden.bs.modal', function () {
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open');
    $('body').css('padding-right', '');
});

// Supondo que você tenha o nível de acesso do usuário disponível na sessão
const user = JSON.parse(sessionStorage.getItem('user')); // Ou qualquer outra forma que você esteja utilizando

// Função para atualizar o menu de navegação com base no nível de acesso
function updateNavigation() {
    const financeLink = document.getElementById('financeLink');

    // Verifica se o usuário existe e obtém o nível de acesso
    if (user) {
        const accessLevel = user.access_level;

        // Se o nível de acesso for 'finance', mantém apenas o link do financeiro
        if (accessLevel === 'finance') {
            // Limpa todos os links, removendo completamente
            document.querySelector('#navLinks').innerHTML = '';
            const financeiroLink = document.createElement('li');
            financeiroLink.className = 'nav-item';
            financeiroLink.innerHTML = '<a class="nav-link active" href="/public/Financeiro.html">Financeiro</a>';
            document.querySelector('#navLinks').appendChild(financeiroLink);
        }
        // Se o nível de acesso não for 'finance', esconde o link de financeiro
        else if (accessLevel !== 'admin') { // Se o usuário não for admin, oculta o link financeiro
            financeLink.style.display = 'none'; // Torna invisível o link financeiro
        }
        // Se o nível de acesso for 'admin', mantém todos os links
    } else {
        // Se não houver usuário, pode esconder ou redirecionar
        document.querySelector('#navLinks').innerHTML = ''; // Pode limpar ou mostrar links de login, etc.
    }
}

// Chama a função para atualizar a navegação
updateNavigation();


