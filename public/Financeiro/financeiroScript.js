$(document).ready(function() {
    let representanteIdSelecionado = null;

        $('#representante').append('<option value="" disabled selected>Selecione um representante</option>');

        // Evento para selecionar um representante
        $('#representante').on('change', function() {
            representanteIdSelecionado = $(this).val();
        });

    
    // Inicialização de eventos
    $('#form-registro').on('submit', function(event) {
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
                observacoes
            }),
            success: function(response) {
                alert('Registro financeiro salvo com sucesso!');
                $('#form-registro')[0].reset();
            },
            error: function(jqXHR, textStatus, errorThrown) {
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
    
        $.get('/api/registros_financeiros', { representante_id: representanteId }, function(data) {
            $('#tabela-registros-modal tbody').empty();
            let totalDebitos = 0;
            let totalCreditos = 0;
    
            data.forEach(reg => {
                let rowClass = '';
                if (parseFloat(unformatCurrency(reg.valor_debito)) > 0) {
                    rowClass = 'bg-debito';
                } else if (parseFloat(unformatCurrency(reg.valor_credito)) > 0) {
                    rowClass = 'bg-credito';
                }

                const horaFormatada = reg.hora ? reg.hora : '';
    
                $('#tabela-registros-modal tbody').append(
                    `<tr class="${rowClass}" data-id="${reg.id}" data-representante-id="${representanteId}">
                        <td class="editable">${formatDate(reg.data)}</td>
                        <td class="editable">${horaFormatada}</td>
                        <td class="editable">${reg.comprador}</td>
                        <td class="editable">${formatCurrency(unformatCurrency(reg.valor_debito) / 100)}</td>
                        <td class="editable">${formatCurrency(unformatCurrency(reg.valor_credito) / 100)}</td>
                        <td class="editable">${reg.observacoes}</td>
                        <td>
                            <button class="btn btn-primary btn-sm edit-btn">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteRegistro(${reg.id})">Excluir</button>
                        </td>
                    </tr>`
                );
    
                totalDebitos += unformatCurrency(reg.valor_debito) / 100;
                totalCreditos += unformatCurrency(reg.valor_credito) / 100;
            });
    
            $('#total-debitos').text(formatCurrency(totalDebitos)).css('color', 'red');
            $('#total-creditos').text(formatCurrency(totalCreditos)).css('color', 'blue');
    
            let saldo = totalCreditos - totalDebitos;
            $('#saldo').text(formatCurrency(saldo)).css('color', saldo < 0 ? 'red' : 'blue');
    
            $('#loading-screen').hide();
            $('#modalRegistrosFinanceiros').modal('show');
    
            $('.edit-btn').click(function() {
                const tr = $(this).closest('tr');
                toggleEditMode(tr);
            });
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar registros financeiros:', textStatus, errorThrown);
            $('#loading-screen').hide();
        });
    }
    

    function toggleEditMode(tr) {
        const isEditing = tr.hasClass('editing');
    
        if (isEditing) {
            const representanteIdOriginal = tr.data('representante-id'); // Verifique se este valor é correto
            const data = formatDateToSQL(tr.find('td:eq(0) input').val());
            const comprador = tr.find('td:eq(1) input').val();
            const valor_debito = unformatCurrency(tr.find('td:eq(2) input').val());
            const valor_credito = unformatCurrency(tr.find('td:eq(3) input').val());
            const observacoes = tr.find('td:eq(4) input').val();
    
            // Verificar se os valores são válidos e não são undefined
            if (!representanteIdOriginal || !data || !comprador || isNaN(valor_debito) || isNaN(valor_credito)) {
                alert('Por favor, preencha todos os campos corretamente.');
                return;
            }
    
            $.ajax({
                url: `/api/registros_financeiros/${tr.data('id')}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    representante_id: representanteIdSelecionado,// Certifique-se de que esse valor é válido
                    data,
                    comprador,
                    valor_debito,
                    valor_credito,
                    observacoes
                }),
                success: function() {
                    tr.find('td.editable').each(function() {
                        const input = $(this).find('input');
                        $(this).text(input.val());
                    });
                    tr.removeClass('editing');
                    tr.find('.edit-btn').text('Editar');
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('Erro ao salvar registro financeiro:', textStatus, errorThrown);
                    alert('Erro ao salvar o registro financeiro.');
                }
            });
        } else {
            tr.find('td.editable').each(function() {
                const text = $(this).text();
                $(this).html(`<input type="text" class="form-control form-control-sm" value="${text}">`);
            });
            tr.addClass('editing');
            tr.find('.edit-btn').text('Salvar');
        }
    }
    
    function loadRepresentantes() {
        $.get('/api/representantes_financeiros', function(data) {
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

            $('.btn-registros').on('click', function() {
                representanteIdSelecionado = $(this).data('id');
                var representanteNome = $(this).data('nome');
                $('#modal-representante-nome').text(representanteNome);
                loadRegistros(representanteIdSelecionado);
            });

            $('#tabela-representantes').DataTable();
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar representantes financeiros:', textStatus, errorThrown);
        });
    }


    // Inicializar
    loadRepresentantes();

    // Adicionar representante financeiro
    $('#form-add-representante').on('submit', function(event) {
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
            success: function() {
                $('#nome_representante').val('');
                loadRepresentantes();
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error('Erro ao adicionar representante financeiro:', textStatus, errorThrown);
            }
        });
    });
    $(document).ready(function() {
        // Função para excluir registro financeiro
        function deleteRegistro(id) {
            if (confirm('Tem certeza que deseja excluir este registro?')) {
                $.ajax({
                    url: `/api/registros_financeiros/${id}`,
                    method: 'DELETE',
                    success: function() {
                        // Remover a linha da tabela
                        $(`tr[data-id="${id}"]`).remove();
                        alert('Registro excluído com sucesso.');
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.error('Erro ao excluir registro financeiro:', textStatus, errorThrown);
                        alert('Erro ao excluir registro financeiro.');
                    }
                });
            }
        }
    
        // Adicionar evento de clique para os botões de exclusão
        $('#tabela-registros-modal').on('click', '.btn-danger', function() {
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
    
    
    $(document).ready(function() {
        $('#form-representante').on('submit', function(event) {
            event.preventDefault(); // Impede o comportamento padrão de envio do formulário
    
            // Coleta os dados do formulário
            var formData = $(this).serialize();
    
            // Envia os dados via AJAX
            $.ajax({
                type: 'POST',
                url: '/api/representantes_financeiros', // Substitua pelo URL de sua API ou endpoint
                data: formData,
                success: function(response) {
                    // Manipule a resposta do servidor aqui
                    console.log('Dados enviados com sucesso', response);
                    $('#modalRepresentante').modal('hide'); // Fecha o modal após o sucesso
                    // Atualize a tabela ou a interface conforme necessário
                    location.reload();
                },
                error: function(xhr, status, error) {
                    // Manipule o erro aqui
                    console.error('Erro ao enviar dados', error);
                }
            });
        });
    });  
});

document.getElementById('search-input').addEventListener('input', function() {
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

document.addEventListener('DOMContentLoaded', function() {
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
            const rowDate = new Date(dateCell.textContent);

            const matchesSearch = rowText.includes(searchTerm);
            const withinDateRange = (
                (!startDate || rowDate >= startDate) &&
                (!endDate || rowDate <= endDate)
            );

            if (matchesSearch && withinDateRange) {
                row.style.display = ''; // Mostra a linha
            } else {
                row.style.display = 'none'; // Esconde a linha
            }
        });
    };
    

    searchInput.addEventListener('input', filterTable);
    startDateInput.addEventListener('change', filterTable);
    endDateInput.addEventListener('change', filterTable);
});

$(document).ready(function() {
    // Função para gerar PDF
    $('#form-gerar-pdf').on('submit', function(event) {
        event.preventDefault(); // Impede o comportamento padrão de envio do formulário

        const representanteId = $('#representante_pdf').val();
        const dataInicio = $('#data_inicio').val();
        const dataFim = $('#data_fim').val();

        if (!representanteId || !dataInicio || !dataFim) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        // Chama o novo endpoint para obter os dados filtrados
        $.get('/api/registros_financeiros_para_pdf', { representante_id: representanteId, data_inicio: dataInicio, data_fim: dataFim }, function(data) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'landscape' }); // Horizontal

            doc.setFontSize(14);
            doc.setFont("helvetica", "bold"); // Define a fonte como Helvetica em negrito
            doc.text('Relatório de Movimentação', 14, 16);


            // Adicionar informações do representante e período
            doc.setFontSize(12);
            doc.text(`Representante: ${$('#representante_pdf option:selected').text()}`, 110, 16);
            doc.text(`Período: ${formatDateToBR(dataInicio)} - ${formatDateToBR(dataFim)}`, 14, 24);


            // Definir posições e largura para a tabela
            let y = 40; // Y inicial para a tabela
            const colWidths = [20, 20, 80, 40, 40, 70]; // Largura das colunas
            const columns = ['Data', 'Hora', 'Comprador', 'Débito', 'Crédito', 'Observações'];

            // Adicionar cabeçalho da tabela
            doc.setFillColor(255, 255, 255); // Cor de fundo cinza
            const headerHeight = 10;
            const headerX = 14; 
            const headerWidth = colWidths.reduce((a, b) => a + b, 0); // Largura do cabeçalho igual à soma das larguras das colunas
            doc.rect(headerX, y - headerHeight, headerWidth, headerHeight, 'F'); 
            doc.setFontSize(10);
            columns.forEach((col, index) => {
                doc.text(col, 14 + colWidths.slice(0, index).reduce((a, b) => a + b, 0), y - 2);
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
    const x = 14 - extraLeftSpace; // Ajuste a posição X para mais espaço à esquerda
    const rectWidth = colWidths.reduce((a, b) => a + b, 0) + extraLeftSpace - rectPadding;
    doc.rect(x, y - rectHeight, rectWidth, rectHeight, 'F');


    // Adicionar o texto para cada coluna
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8); // Tamanho padrão da fonte
    doc.setTextColor(0, 0, 0); // Cor do texto preta

    // Ajustar a posição do texto para cima
    const textY = y - textOffset;

    doc.text(formatDate(reg.data), 14, textY);
    doc.text(reg.comprador, 14 + colWidths[0], textY);
    doc.text(reg.hora, 14 + colWidths[0], textY);
    const valorDebito = unformatCurrency(reg.valor_debito) / 100;
    const valorCredito = unformatCurrency(reg.valor_credito) / 100;
    doc.text(formatCurrency(valorDebito), 14 + colWidths[0] + colWidths[1], textY);
    doc.text(formatCurrency(valorCredito), 14 + colWidths[0] + colWidths[1] + colWidths[2], textY);
    
    // Ajustar texto da coluna de observações
    if (reg.observacoes.length > 100) {
        doc.setFontSize(8); // Reduzir o tamanho da fonte
        const obsText = doc.splitTextToSize(reg.observacoes, colWidths[4]); // Quebra o texto
        obsText.forEach((line, lineIndex) => {
            doc.text(line, 14 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], textY + (lineIndex * 8)); // Espaço entre linhas
        });
        y += (obsText.length * 8); // Ajusta a altura de acordo com o número de linhas
    } else {
        doc.setFontSize(10); // Tamanho padrão da fonte
        doc.text(reg.observacoes, 14 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], textY);
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
           
           // Adicionar o saldo final
           doc.text(textSaldo, xRightSaldo, totalsRowY + 24);
           doc.text(formatCurrency(saldo), xRightSaldo + doc.getTextWidth(textSaldo), totalsRowY + 24);
           
           // Resetar a cor para o padrão após adicionar o saldo
           doc.setTextColor(0, 0, 0);
           

            // Salvar o PDF
            doc.save(`relatorio_financeiro_${representanteId}_${dataInicio}_a_${dataFim}.pdf`);
        }).fail(function(jqXHR, textStatus, errorThrown) {
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
        $.get('/api/representantes_financeiros', function(data) {
            $('#representante_pdf').empty();
            data.forEach(rep => {
                $('#representante_pdf').append(`<option value="${rep.id}">${rep.nome}</option>`);
            });
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar representantes para PDF:', textStatus, errorThrown);
        });
    }

    function formatDateToBR(dateString) {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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

    // Função para carregar compradores associados ao representante selecionado
    function carregarCompradores(representanteId) {
        fetch(`/api/compradores?representante_id=${representanteId}`)
            .then(response => response.json())
            .then(data => {
                // Limpar o campo de compradores
                compradorSelect.innerHTML = '<option value="">Selecione um comprador</option>';
                // Preencher o campo de compradores
                data.forEach(comprador => {
                    const option = document.createElement('option');
                    option.value = comprador.id;
                    option.textContent = comprador.nome;
                    compradorSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Erro ao carregar compradores:', error);
            });
    }
    

    // Preencher o campo de representantes (se necessário)
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

    // Adicionar evento de mudança ao select de representantes
    representanteSelect.addEventListener('change', function () {
        const representanteId = this.value;
        if (representanteId) {
            carregarCompradores(representanteId);
        } else {
            compradorSelect.innerHTML = '<option value="">Selecione um comprador</option>';
        }
    });
});




