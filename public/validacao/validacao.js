$(document).ready(function () {
    // Carrega os envios ao carregar a página
    loadEnvios();

    let previousEnvios = []; // Armazena os envios anteriores

    // Carrega os envios da API
    function loadEnvios() {
        $.ajax({
            url: '/api/envios',
            method: 'GET',
            success: function (envios) {
                populateCards(envios);

                // Verifica se houve novos envios
                if (hasNewEnvios(envios)) {
                    playNotificationSound(); // Toca o som se houver novos dados
                }

                // Atualiza os envios anteriores
                previousEnvios = envios;
            },
            error: function (err) {
                console.error('Erro ao carregar envios:', err);
            }
        });
    }

    // Função para verificar se há novos envios
    function hasNewEnvios(currentEnvios) {
        return currentEnvios.length > previousEnvios.length;
    }

    // Função para tocar o som de notificação
    function playNotificationSound() {
        const audio = new Audio('/musicNotifaction/toque.mp3')
        audio.play().catch(error => {
            console.error('Erro ao reproduzir o som:', error);
        });
    }

    function populateCards(envios) {
        const enviosContainer = $('#enviosContainer');
        enviosContainer.empty(); // Limpa o conteúdo do contêiner

        envios.forEach(envio => {
            const formattedDate = formatDate(envio.data_envio); // Formata a data
            const formattedTime = formatTime(envio.hora_envio); // Formata a hora

            const card = `
                  <div class="col-12 mb-2"> <!-- Usando col-12 para um card por linha -->
                    <div class="card">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-3 text-start"> <!-- Coluna para o Nome do Representante -->
                                    <h5 class="card-title mb-0">${envio.nome_representante}</h5>
                                </div>
                                <div class="col-3 text-start"> <!-- Coluna para a Data de Envio -->
                                    <p class="card-text mb-0"><strong></strong> ${formattedDate}</p>
                                </div>
                                <div class="col-3 text-start"> <!-- Coluna para a Hora de Envio -->
                                    <p class="card-text mb-0"><strong></strong> ${formattedTime}</p>
                                </div>
                                <div class="col-3 text-end"> <!-- Coluna para o Botão -->
                                    <button class="btn btn-info view-info" data-envio-id="${envio.envio_id}">Ver Informações</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            enviosContainer.append(card); // Adiciona o card ao contêiner
        });

        // Adiciona evento para o botão "Ver Informações"
        $('.view-info').click(function () {
            const envioId = $(this).data('envio-id');
            showEnvioInfo(envioId);
        });
    }

    setInterval(function () {
        loadEnvios();
    }, 1000);

    function showEnvioInfo(envioId) {
        $.ajax({
            url: `/api/envios/${envioId}`,
            method: 'GET',
            success: function (data) {
                // Preencher os campos conforme necessário
                $('#representante').val(data.nome_representante || 'Não disponível');
                $('#comprador').val(data.nome_comprador || 'Não disponível'); // Ajuste aqui para mostrar o nome
                $('#dataEnvio').val(formatDate(data.data_envio) || 'Data não disponível');
                $('#horaEnvio').val(formatTime(data.hora_envio) || 'Hora não disponível');
                $('#apelido').val(data.apelido || 'Não disponível');
                $('#cpfCnpj').val(data.cpf_cnpj || 'Não disponível');
                $('#rg').val(data.rg || 'Não disponível');
                $('#maquina').val(data.nomeequipamento || 'Não disponível'); // Ajuste aqui para mostrar o nome da máquina
                $('#tipo').val(data.tipo || 'Não disponível');

                // Limpar linhas anteriores
                $('#linhasContainer').empty();

                // Adicionar linhas, se houver
                if (data.linhas && data.linhas.length > 0) {
                    data.linhas.forEach((linha, index) => {
                        let imagePreview = 'Sem imagem';
                        if (linha.imagem) {
                            // Converte o blob da imagem para uma URL base64
                            const base64String = btoa(
                                new Uint8Array(linha.imagem.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
                            );
                            imagePreview = `<img src="data:image/jpeg;base64,${base64String}" alt="Imagem linha ${linha.numeroLinha}" class="img-fluid image-preview" style="width: 350px; height: auto; border: 1px solid #ddd; border-radius: 4px;" onclick="openImageModal('${base64String}')">`;

                        }

                        const linhaHtml = `
    <div class="linha mb-3">
        <h5>Linha ${linha.numeroLinha || 'Não disponível'}</h5>
        <div class="row">
            <div class="col-2 d-flex align-items-center">
                ${imagePreview}
            </div>
            <div class="col-5">
                <div class="row">
                    <div class="col-12">
                        <div class="form-group">
                            <label>PD:</label>
                            <input type="text" class="form-control" value="${linha.pd || 'Não disponível'}" readonly>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="form-group">
                            <label>PT:</label>
                            <input type="text" class="form-control" value="${linha.pt || 'Não disponível'}" readonly>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="form-group">
                            <label>RH:</label>
                            <input type="text" class="form-control" value="${linha.rh || 'Não disponível'}" readonly>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-5">
                <div class="row">
                    <div class="col-12">
                        <div class="form-group">
                            <label>KG:</label>
                            <input type="text" class="form-control" value="${linha.kg || 'Não disponível'}" readonly>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="form-group">
                            <label>Valor KG:</label>
                            <input type="text" class="form-control" value="${linha.valor_kg || 'Não disponível'}" readonly>
                        </div>
                    </div>
                    <div class="col-12">
                        <div class="form-group">
                            <label>Valor Total:</label>
                            <input type="text" class="form-control" value="${linha.valor || 'Não disponível'}" readonly>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    ${index < data.linhas.length - 1 ? '<hr>' : ''}
`;
                        $('#linhasContainer').append(linhaHtml);

                    });
                } else {
                    $('#linhasContainer').append('<p>Nenhuma linha encontrada para este envio.</p>');
                }

                loadLotes();
                // Adiciona a classe para tela cheia e abre o modal
                $('#infoModal').modal('show').addClass('modal-fullscreen');
            },
            error: function (err) {
                console.error('Erro ao carregar informações do envio:', err);
            }
        });
    }


    function formatDate(dateString) {
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', options); // Formata a data para o padrão brasileiro
    }

    function formatTime(timeString) {
        if (!timeString) return 'Hora não disponível'; // Verifica se timeString é válido
        const [hour, minute] = timeString.split(':');
        return `${hour}:${minute}`; // Formata a hora
    }

    // Lógica para o botão OK
    $('#confirmarBtn').on('click', function () {
        // Captura as informações do modal
        const dadosEnvio = {
            representante: $('#representante').val(),
            comprador: $('#comprador').val(),
            fornecedor: $('#comprador').val(),
            horaEnvio: $('#horaEnvio').val(),
            apelido: $('#apelido').val(),
            cpfCnpj: $('#cpfCnpj').val(),
            rg: $('#rg').val(),
            maquina: $('#maquina').val(),
            sn: $('#maquina').val(),
            tipo: $('#tipo').val(),
            lote: $('#lote option:selected').text(),
            linhas: []
        };


        // Captura as informações das linhas
        $('.linha').each(function () {
            const linha = {
                kg: $(this).find('input:eq(0)').val(),
                pd: $(this).find('input:eq(1)').val(),
                pt: $(this).find('input:eq(2)').val(),
                rh: $(this).find('input:eq(3)').val(),
                valorkg: $(this).find('input:eq(4)').val(),
                Valor: $(this).find('input:eq(5)').val(),
                imagem: $(this).find('input[type="file"]').get(0).files[0]
            };
            dadosEnvio.linhas.push(linha);
        });

        function formatDateForServer(dateString) {
            if (!dateString) {
                alert('A data é obrigatória.');
                return null;
            }
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = (`0${date.getMonth() + 1}`).slice(-2);
            const day = (`0${date.getDate()}`).slice(-2);
            return `${year}-${month}-${day}`;
        }

        dadosEnvio.dataEnvio = formatDateForServer($('#dataEnvio').val());

        // Validação dos dados
        if (!dadosEnvio.representante || !dadosEnvio.linhas.length || !dadosEnvio.dataEnvio) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        // Exibir os dados que serão enviados para depuração
        console.log('Dados a serem enviados:', dadosEnvio);

        // Crie um FormData para enviar a imagem junto com os dados
        const formData = new FormData();
        formData.append('dadosEnvio', JSON.stringify(dadosEnvio));

        // Adiciona as imagens de cada linha ao FormData
        dadosEnvio.linhas.forEach((linha, index) => {
            if (linha.imagem) {
                formData.append(`imagem_${index}`, linha.imagem);
            }
        });


        // Enviar dados para o servidor
        $.ajax({
            url: '/api/envios/conferir',
            method: 'POST',
            processData: false, // Não processar os dados
            contentType: false, // Não definir o tipo de conteúdo
            data: formData,
            success: function (response) {
                console.log('Dados enviados com sucesso:', response);
                alert('Dados enviados com sucesso!');
                $('#infoModal').modal('hide');
                location.reload();
            },
            error: function (err) {
                console.error('Erro ao enviar dados:', err);
                alert('Ocorreu um erro ao enviar os dados.');
            }
        });
    });
});

// Função para abrir o modal com a imagem
function openImageModal(base64String) {
    // Define o src da imagem no modal
    $('#modalImage').attr('src', `data:image/jpeg;base64,${base64String}`);
    // Abre o modal
    $('#imageModal').modal('show');
}
$(document).ready(function () {
    // Torna o modal arrastável
    $("#imageModal").draggable({
        handle: ".modal-header" // Permite arrastar pelo cabeçalho do modal
    });
});


function getLastNpdf(representanteId, callback) {
    const query = `
        SELECT Npdf 
        FROM dados 
        WHERE representante_id = ? 
        ORDER BY Npdf DESC 
        LIMIT 1;
    `;

    db.query(query, [representanteId], (err, results) => {
        if (err) {
            console.error('Erro ao buscar último Npdf:', err);
            return callback(err);
        }

        // Retorna o último Npdf ou 0 se não houver registros
        const lastNpdf = results.length > 0 ? results[0].Npdf : 0;
        callback(null, lastNpdf);
    });
}

function loadLotes() {
    $.ajax({
        url: '/api/lote',
        method: 'GET',
        success: function (data) {
            const loteSelect = $('#lote');
            loteSelect.empty(); // Limpa o dropdown
            loteSelect.append('<option value="">Selecione um lote</option>'); // Adiciona a opção padrão
            data.forEach(lote => {
                loteSelect.append(`<option value="${lote.id}">${lote.nome}</option>`); // Valor é o ID, texto é o nome
            });
        },
        error: function (err) {
            console.error('Erro ao carregar lotes:', err);
        }
    });
}
