$(document).ready(function () {
    // Função para mostrar o conteúdo baseado no link clicado
    function showContent(contentId) {
        $('.content-section').removeClass('active');
        $(contentId).addClass('active');
    }

    $('#dashboardLink').click(function () {
        showContent('/public/configuracao.html');
    });

    $('#extractionsLink').click(function () {
        $('.content').load('/configuracaoPage/cadastroLote.html');
    });


    $('#foldersLink').click(function () {
        showContent('#foldersContent');
    });

    $('#cooperadosLink').click(function () {
        showContent('#cooperadosContent');
    });

    $('#representativesLink').click(function () {
        showContent('#representativesContent');
    });

    // Opcional: Mostrar conteúdo padrão ao carregar a página
    showContent('#dashboardContent');
});
document.addEventListener('DOMContentLoaded', function () {
    const loteForm = document.getElementById('loteForm');
    loteForm.addEventListener('submit', function (event) {
        event.preventDefault();

        const nomeLote = document.getElementById('nomeLote').value;

        fetch('/api/lote', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome: nomeLote })
        })
            .then(response => response.json())
            .then(data => {
                alert('Lote cadastrado com sucesso!');
                loteForm.reset();
            })
            .catch(error => {
                console.error('Erro ao cadastrar lote:', error);
            });
    });
});


$(document).ready(function() {
    // Função para carregar lotes
    function loadLotes() {
        $.ajax({
            url: '/api/lote', // Endpoint para buscar lotes
            method: 'GET',
            success: function(data) {
                const selectLotePadrao = $('#lotePadrao');
                selectLotePadrao.empty(); // Limpa o select antes de preencher
                selectLotePadrao.append('<option value="" disabled selected>Escolha um lote</option>'); // Opção padrão

                // Preenche o select com os lotes
                data.forEach(lote => {
                    const option = `<option value="${lote.id}">${lote.nome}</option>`; // Usa o id como valor
                    selectLotePadrao.append(option);
                });
            },
            error: function(err) {
                console.error('Erro ao buscar lotes:', err);
                alert('Erro ao carregar lotes. Verifique o console para mais detalhes.'); // Mensagem de erro
            }
        });
    }

    // Evento para definir o lote padrão
    $('#definirLotePadrao').click(function() {
        const lotePadrao = $('#lotePadrao').val(); // Obtém o valor do lote selecionado
        console.log("Lote Padrão Selecionado:", lotePadrao); // Log para verificar o valor
        if (lotePadrao) {
            $.ajax({
                url: '/api/setLotePadrao', // Endpoint para definir lote padrão
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ lotePadrao }), // Envia o lote padrão selecionado
                success: function(response) {
                    alert(response.message); // Alerta de sucesso
                    loadLotes(); // Recarrega os lotes após definir o padrão
                },
                error: function(err) {
                    console.error("Erro ao definir lote padrão:", err);
                    alert('Erro ao definir lote padrão.'); // Alerta de erro
                }
            });
        } else {
            alert('Por favor, escolha um lote.'); // Mensagem se nenhum lote for selecionado
        }
    });
    
    

    // Carregar lotes ao iniciar a página
    loadLotes();
});




