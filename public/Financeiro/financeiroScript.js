$(document).ready(function () {
    let representanteIdSelecionado = null;

    $('#representante').append('<option value="" disabled selected>Selecione um representante</option>');

    // Evento para selecionar um representante
    $('#representante').on('change', function () {
        representanteIdSelecionado = $(this).val();
    });

    // Inicialização de eventos
    $('#form-registro').on('submit', function (event) {
        event.preventDefault(); // Evita a submissão padrão do formulário

        if (!representanteIdSelecionado) {
            alert('Por favor, selecione um representante.');
            return;
        }

        // Coletar os valores dos campos
        const representante_id = $('#representante').val();
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

        // Enviar dados para o servidor
        $.ajax({
            url: '/api/registros_financeiros',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                representante_id: representanteIdSelecionado,
                data,
                hora,
                comprador,
                valor_debito,
                valor_credito,
                pagamento,
                observacoes
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
                            <button class="btn btn-primary btn-sm edit-btn">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteRegistro(${reg.id})">Excluir</button>
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


    $(document).ready(function () {
        $('#form-representante').on('submit', function (event) {
            event.preventDefault(); // Impede o comportamento padrão de envio do formulário

            // Coleta os dados do formulário
            var formData = $(this).serialize();

            // Envia os dados via AJAX
            $.ajax({
                type: 'POST',
                url: '/api/representantes_financeiros', // Substitua pelo URL de sua API ou endpoint
                data: formData,
                success: function (response) {
                    // Manipule a resposta do servidor aqui
                    console.log('Dados enviados com sucesso', response);
                    $('#modalRepresentante').modal('hide'); // Fecha o modal após o sucesso
                    // Atualize a tabela ou a interface conforme necessário
                    location.reload();
                },
                error: function (xhr, status, error) {
                    // Manipule o erro aqui
                    console.error('Erro ao enviar dados', error);
                }
            });
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
            const colWidths = [20, 30, 50, 40, 40, 40, 70]; // Largura das colunas
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

            // Adicionar linhas da tabela
            const linesPerPage = 30; // Número de linhas por página
            const lineHeight = 10; // Altura de cada linha
            function checkAddPage(doc, y, currentPageLines) {
                if (currentPageLines >= linesPerPage) {
                    doc.addPage();
                    y = 20; // Margem superior da nova página
                    currentPageLines = 0; // Reiniciar contagem de linhas
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

                // Desenhar o retângulo de fundo para a linha com largura e altura ajustadas
                const x = headerX - extraLeftSpace; // Ajuste a posição X para mais espaço à esquerda
                const rectWidth = headerWidth + extraLeftSpace - rectPadding;
                doc.rect(x, y - rectHeight, rectWidth, rectHeight, 'F');

                // Adicionar o texto para cada coluna
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8); // Tamanho padrão da fonte
                doc.setTextColor(0, 0, 0); // Cor do texto preta

                // Ajustar a posição do texto para cima
                const textY = y - textOffset;
                const compradorTexto = reg.comprador ? reg.comprador.toString() : '';
                const safeText = (value) => (value !== undefined && value !== null) ? value.toString() : '';

                // Adicionar textos de forma ajustada
                doc.text(formatDate(reg.data), headerX, textY);
                doc.text(safeText(reg.hora || ''), headerX + colWidths[0], textY); // Verificar se "hora" está vazio
                doc.text(compradorTexto, headerX + colWidths[0] + colWidths[1], textY);

                const valorDebito = unformatCurrency(reg.valor_debito) / 100;
                const valorCredito = unformatCurrency(reg.valor_credito) / 100;

                doc.text(formatCurrency(valorDebito), headerX + colWidths[0] + colWidths[1] + colWidths[2], textY);
                doc.text(formatCurrency(valorCredito), headerX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], textY);

                // Ajustar a posição da coluna "pagamento"
                doc.text(safeText(reg.pagamento || ''), headerX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4], textY);

                // Ajustar texto da coluna de observações
                if (reg.observacoes.length > 100) {
                    doc.setFontSize(8); // Reduzir o tamanho da fonte
                    const obsText = doc.splitTextToSize(reg.observacoes, colWidths[6]); // Quebra o texto
                    obsText.forEach((line, lineIndex) => {
                        doc.text(line, headerX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], textY + (lineIndex * 8)); // Espaço entre linhas
                    });
                    y += (obsText.length * 8); // Ajusta a altura de acordo com o número de linhas
                } else {
                    doc.setFontSize(10); // Tamanho padrão da fonte
                    doc.text(reg.observacoes, headerX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4] + colWidths[5], textY);
                }

                // Atualizar totais
                totalDebitos += valorDebito;
                totalCreditos += valorCredito;

                // Incrementar o contador de linhas e a posição Y
                currentPageLines++;
                y += lineHeight; // Espaço entre linhas (ajustado para caber o texto de várias linhas, se necessário)
            });

            // Adicionar linha de totais
            doc.setFontSize(10);
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



            // Adicionar o saldo final
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

    // Função para carregar representantes no formulário PDF
    function loadRepresentantesForPdf() {
        $.get('/api/representantes_financeiros', function (data) {
            $('#representante_pdf').empty();
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
    // Preencher o select com representantes financeiros
    fetch('/api/representantes_financeiros')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('representante_select');
            data.forEach(representante => {
                const option = document.createElement('option');
                option.value = representante.id;
                option.textContent = representante.nome;
                select.appendChild(option);
            });
        });

    // Enviar o formulário ao servidor
    document.getElementById('formCadastroComprador').addEventListener('submit', function (event) {
        event.preventDefault();

        const formData = new FormData(this);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        fetch('/api/compradores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => {
                if (response.ok) {
                    alert('Comprador cadastrado com sucesso!');
                    $('#modalCadastroComprador').modal('hide');
                } else {
                    alert('Erro ao cadastrar comprador');
                }
            })
            .catch(error => {
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


