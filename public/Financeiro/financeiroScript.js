$(document).ready(function() {
    // Inicialização de eventos
    $('#form-registro').on('submit', function(event) {
        event.preventDefault(); // Evita a submissão padrão do formulário

        // Coletar os valores dos campos
        const representante_id = $('#representante').val();
        const data = $('#data').val();
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
                representante_id,
                data,
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
        let number = parseFloat(value).toFixed(2);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
    }

    function unformatCurrency(value) {
        return parseFloat(value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(/,/g, '.')) || 0;
    }

    function loadRegistros(representanteId) {
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

                $('#tabela-registros-modal tbody').append(
                    `<tr class="${rowClass}" data-id="${reg.id}" data-representante-id="${reg.representante_id}">
                        <td>${reg.id}</td>
                        <td class="editable">${reg.data}</td>
                        <td class="editable">${reg.comprador}</td>
                        <td class="editable">${formatCurrency(reg.valor_debito)}</td>
                        <td class="editable">${formatCurrency(reg.valor_credito)}</td>
                        <td class="editable">${reg.observacoes}</td>
                        <td>
                            <button class="btn btn-primary btn-sm edit-btn">Editar</button>
                            <button class="btn btn-danger btn-sm" onclick="deleteRegistro(${reg.id})">Excluir</button>
                        </td>
                    </tr>`
                );

                totalDebitos += unformatCurrency(reg.valor_debito);
                totalCreditos += unformatCurrency(reg.valor_credito);
            });

            $('#total-debitos').text(formatCurrency(totalDebitos));
            $('#total-creditos').text(formatCurrency(totalCreditos));
            $('#saldo').text(formatCurrency(totalCreditos - totalDebitos));

            $('#modalRegistrosFinanceiros').modal('show');

            $('.edit-btn').click(function() {
                const tr = $(this).closest('tr');
                toggleEditMode(tr);
            });
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar registros financeiros:', textStatus, errorThrown);
        });
    }

    function toggleEditMode(tr) {
        const isEditing = tr.hasClass('editing');

        if (isEditing) {
            const id = tr.data('id');
            const representanteIdOriginal = tr.data('representante-id'); // Manter o ID do representante original
            const data = tr.find('td:eq(1) input').val();
            const comprador = tr.find('td:eq(2) input').val();
            const valor_debito = unformatCurrency(tr.find('td:eq(3) input').val());
            const valor_credito = unformatCurrency(tr.find('td:eq(4) input').val());
            const observacoes = tr.find('td:eq(5) input').val();

            $.ajax({
                url: `/api/registros_financeiros/${id}`,
                method: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify({
                    representante_id: representanteIdOriginal, // Usar o ID do representante original
                    data,
                    comprador,
                    valor_debito,
                    valor_credito,
                    observacoes
                }),
                success: function() {
                    tr.find('td.editable').each(function(index) {
                        const input = $(this).find('input');
                        $(this).text(input.val());
                    });
                    tr.removeClass('editing');
                    tr.find('.edit-btn').text('Editar');
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    console.error('Erro ao salvar registro financeiro:', textStatus, errorThrown);
                }
            });
        } else {
            tr.find('td.editable').each(function(index) {
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
                var representanteId = $(this).data('id');
                var representanteNome = $(this).data('nome');
                $('#modal-representante-nome').text(representanteNome);
                loadRegistros(representanteId);
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
    
});
