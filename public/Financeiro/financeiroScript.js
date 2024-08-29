$(document).ready(function() {
    // Inicializar Cleave.js para os campos de valor
    new Cleave('#valor_debito', {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalMark: ',',
        delimiter: '.',
        prefix: 'R$ ',
        numeralDecimalScale: 2 // Permite até duas casas decimais
    });

    new Cleave('#valor_credito', {
        numeral: true,
        numeralThousandsGroupStyle: 'thousand',
        numeralDecimalMark: ',',
        delimiter: '.',
        prefix: 'R$ ',
        numeralDecimalScale: 2 // Permite até duas casas decimais
    });

    // Função para formatar valores como moeda brasileira (R$)
    function formatCurrency(value) {
        let number = parseFloat(value).toFixed(2);
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(number);
    }

    // Função para limpar a formatação de moeda e retornar um número decimal
    function unformatCurrency(value) {
        return parseFloat(value.replace(/R\$\s?/g, '').replace(/\./g, '').replace(/,/g, '.')) || 0;
    }

    // Função para carregar registros financeiros
    function loadRegistros(representanteId) {
        $.get('/api/registros_financeiros', { representante_id: representanteId }, function(data) {
            $('#tabela-registros-modal tbody').empty(); // Limpar a tabela do modal

            let totalDebitos = 0;
            let totalCreditos = 0;

            data.forEach(reg => {
                let rowClass = '';
                if (parseFloat(unformatCurrency(reg.valor_debito)) > 0) {
                    rowClass = 'bg-debito'; // Aplicar fundo vermelho clarinho se débito > 0
                } else if (parseFloat(unformatCurrency(reg.valor_credito)) > 0) {
                    rowClass = 'bg-credito'; // Aplicar fundo azul clarinho se crédito > 0
                }

                $('#tabela-registros-modal tbody').append(`
                    <tr class="${rowClass}">
                        <td>${reg.id}</td>
                        <td>${reg.data}</td>
                        <td>${reg.comprador}</td>
                        <td>${formatCurrency(reg.valor_debito)}</td>
                        <td>${formatCurrency(reg.valor_credito)}</td>
                        <td>${reg.observacoes}</td>
                    </tr>
                `);

                // Somar débitos e créditos
                totalDebitos += unformatCurrency(reg.valor_debito);
                totalCreditos += unformatCurrency(reg.valor_credito);
            });

            // Atualizar o resumo
            $('#total-debitos').text(formatCurrency(totalDebitos));
            $('#total-creditos').text(formatCurrency(totalCreditos));
            $('#saldo').text(formatCurrency(totalCreditos - totalDebitos));

            $('#modalRegistrosFinanceiros').modal('show'); // Mostrar o modal
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar registros financeiros:', textStatus, errorThrown);
        });
    }

    // Função para carregar representantes financeiros
    function loadRepresentantes() {
        $.get('/api/representantes_financeiros', function(data) {
            $('#representantes-container').empty(); // Limpar o container
            $('#representante').empty(); // Limpar o dropdown
            $('#tabela-representantes tbody').empty(); // Limpar a tabela

            var container = $('<div class="row"></div>'); // Container para linhas de botões

            data.forEach((rep, index) => {
                // Adicionar representantes ao dropdown
                $('#representante').append(`<option value="${rep.id}">${rep.nome}</option>`);

                // Adicionar representantes à tabela
                $('#tabela-representantes tbody').append(`<tr><td>${rep.id}</td><td>${rep.nome}</td></tr>`);

                // Adicionar representantes ao container de botões
                if (index % 4 === 0 && index !== 0) { // Ajustar para 4 botões por linha
                    $('#representantes-container').append(container); // Adicionar linha ao container
                    container = $('<div class="row"></div>'); // Criar nova linha
                }

                container.append(`
                    <div class="col-md-3 mb-2">
                        <button class="btn btn-primary btn-lg btn-registros" data-id="${rep.id}" data-nome="${rep.nome}">${rep.nome}</button>
                    </div>
                `);
            });

            // Adicionar a última linha se não estiver vazia
            if (container.children().length > 0) {
                $('#representantes-container').append(container);
            }

            // Adicionar evento de clique para os botões de registros
            $('.btn-registros').on('click', function() {
                var representanteId = $(this).data('id');
                var representanteNome = $(this).data('nome');
                $('#modal-representante-nome').text(representanteNome);
                loadRegistros(representanteId);
            });

            // Atualizar a tabela de representantes no modal
            $('#tabela-representantes-modal tbody').empty();
            data.forEach(rep => {
                $('#tabela-representantes-modal tbody').append(`
                    <tr>
                        <td>${rep.id}</td>
                        <td>${rep.nome}</td>
                    </tr>
                `);
            });
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Erro ao carregar representantes financeiros:', textStatus, errorThrown);
        });
    }

    // Carregar representantes quando o modal é mostrado
    $('#modalRepresentantes').on('show.bs.modal', function() {
        loadRepresentantes();
    });

    // Inicializar
    loadRepresentantes();

    // Adicionar representante financeiro
    $('#form-representante').on('submit', function(e) {
        e.preventDefault();
        $.post('/api/representantes_financeiros', $(this).serialize(), function() {
            $('#modalRepresentante').modal('hide'); // Fechar o modal
            loadRepresentantes(); // Atualizar a lista de representantes
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Erro ao salvar representante:', textStatus, errorThrown);
            alert('Erro ao salvar representante.');
        });
    });

    // Função para adicionar registro financeiro
    $('#form-registro').on('submit', function(e) {
        e.preventDefault();
        
        // Obter e desformatar os valores dos campos de entrada
        var valorDebito = unformatCurrency($('#valor_debito').val());
        var valorCredito = unformatCurrency($('#valor_credito').val());

        // Criar um objeto com os dados do formulário
        var formData = $(this).serializeArray();
        formData = formData.filter(field => field.name !== 'valor_debito' && field.name !== 'valor_credito'); // Remover campos antigos
        formData.push({ name: 'valor_debito', value: valorDebito });
        formData.push({ name: 'valor_credito', value: valorCredito });

        // Enviar os dados para o servidor
        $.post('/api/registros_financeiros', $.param(formData), function() {
            // Atualizar a lista de registros financeiros para o representante selecionado
            var representanteId = $('#representante').val();
            if (representanteId) {
                loadRegistros(representanteId);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error('Erro ao salvar registro financeiro:', textStatus, errorThrown);
            alert('Erro ao salvar registro financeiro.');
        });
    });
});
