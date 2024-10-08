document.addEventListener('DOMContentLoaded', function () {
    const representanteSelect = document.getElementById('representanteSelect');
    fetch('/api/representantes')
        .then(response => response.json())
        .then(representantes => {
            representantes.forEach(representante => {
                const option = document.createElement('option');
                option.value = representante.id;
                option.textContent = representante.nome;
                representanteSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar representantes:', error));
});

document.getElementById('representanteSelect').addEventListener('change', function () {
    const representante = this.options[this.selectedIndex].text; // Usa o nome do representante selecionado
    const loteSelect = document.getElementById('loteSelect');

    loteSelect.innerHTML = '';  // Limpar opções anteriores de lotes

    fetch(`/api/lotes?representante=${encodeURIComponent(representante)}`)
        .then(response => response.json())
        .then(lotes => {
            // Adiciona uma opção vazia
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Selecione o lote';
            loteSelect.appendChild(emptyOption);

            lotes.forEach(lote => {
                const option = document.createElement('option');
                option.value = lote.lote;
                option.textContent = lote.lote;
                loteSelect.appendChild(option);
            });

            // Remove a opção vazia após a primeira seleção (opcional)
            loteSelect.addEventListener('focus', function () {
                emptyOption.disabled = true;
            });
        })
        .catch(error => console.error('Erro ao carregar lotes:', error));
});


document.getElementById('loteSelect').addEventListener('change', function () {
    const representanteId = document.getElementById('representanteSelect').value;
    const lote = this.value;
    const npdfSelect = document.getElementById('npdfSelect');
    
    npdfSelect.innerHTML = '';  // Limpar opções anteriores de Npecas

    fetch(`/api/pecas?representante=${representanteId}&lote=${encodeURIComponent(lote)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar Npdfs: ' + response.statusText);
            }
            return response.json();
        })
        .then(npdfs => {
            // Verifica se o array retornado está vazio
            if (npdfs.length === 0) {
                throw new Error('Nenhuma peça encontrada.');
            }
            
            npdfs.forEach(npdf => {
                const option = document.createElement('option');
                option.value = npdf.npeca;  // Valor será o identificador da peça
                option.textContent = npdf.npeca; // Texto será o nome ou identificador
                npdfSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar Npdfs:', error.message);
            alert('Erro ao carregar Npdfs: ' + error.message); // Mostrar erro ao usuário
        });
});


document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('uploadForm').addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData();
        const pdfpecas = document.getElementById('pdfFiles').files; // Certifique-se que este ID existe
        const photopecas = document.getElementById('photoFiles').files; // Certifique-se que este ID existe
        const representanteId = document.getElementById('representanteSelect').value;
        const lote = document.getElementById('loteSelect').value;
        const npeca = document.getElementById('npdfSelect').value;

        console.log('Representante selecionado:', representanteId);
        console.log('Lote selecionado:', lote);
        console.log('Npeca selecionado:', npeca);

        Array.from(pdfpecas).forEach(file => {
            formData.append('pdfpecas', file);
        });

        Array.from(photopecas).forEach(file => {
            formData.append('photopecas', file);
        });

        formData.append('representanteId', representanteId);
        formData.append('lote', lote);
        formData.append('npeca', npeca);

        try {
            const response = await fetch('/upload/files', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                console.error('Falha ao fazer upload dos arquivos');
            } else {
                console.log('Arquivos enviados com sucesso');
            }
        } catch (error) {
            console.error('Erro ao enviar arquivos:', error);
        }
    });
});


/*document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
    uploadFiles();
});*/


function carregarRepresentantes() {
    fetch('/representantes')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('representante');
            data.forEach(representante => {
                const option = document.createElement('option');
                option.value = representante.id;
                option.textContent = representante.nome;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar representantes:', error);
            alert('Erro ao carregar a lista de representantes.');
        });
}

function atualizarBarraDeAcoes() {
    const selectedCards = document.querySelectorAll('.card-selected');
    const actionBar = document.getElementById('actionBar');
    
    if (selectedCards.length > 0) {
        actionBar.classList.remove('d-none');
    } else {
        actionBar.classList.add('d-none');
    }
}

// Adiciona evento para o clique do checkbox
document.addEventListener('click', function (event) {
    // Verifica se o clique foi no checkbox
    if (event.target.classList.contains('card-checkbox')) {
        // Impede que o clique no checkbox propague para o card
        event.stopPropagation();

        const card = event.target.closest('.card-clickable');
        if (card) {
            if (event.target.checked) {
                card.classList.add('card-selected');
            } else {
                card.classList.remove('card-selected');
            }
            atualizarBarraDeAcoes();
        }
    }
});

// Adiciona evento para o clique do card
document.addEventListener('click', function (event) {
    const card = event.target.closest('.card-clickable');

    // Verifica se o clique foi fora do checkbox e dentro do card
    if (card && !event.target.classList.contains('card-checkbox')) {
        const cardId = card.querySelector('.card-checkbox').getAttribute('data-id');
        const pdfIndex = pdfs.findIndex(pdf => pdf.id == cardId);
        if (pdfIndex !== -1) {
            exibirPDF(pdfIndex);
        }
    }
});

// Função para carregar PDFs e adicionar os cards
function carregarPDFs() {
    const representanteId = document.getElementById('representante').value;
    const loteId = document.getElementById('lote').value;
    const pdfsPorLinha = document.getElementById('pdfsPorLinha').value;
    const url = representanteId ? `/pecaspdf?representante_id=${representanteId}&lote_id=${loteId}` : '/pecaspdf';

    // Adicionar log para verificar se a URL está correta
    console.log('URL para fetch:', url);

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Dados recebidos:', data); // Verifique se os dados são os esperados
            pdfs = data; // Salvar a lista de PDFs carregados
            const listaPDFs = document.getElementById('lista-pdfs');
            listaPDFs.innerHTML = '';

            data.forEach((pdf, index) => {
                const card = document.createElement('div');
                card.className = `col-md-${12 / pdfsPorLinha} mb-4`;

                card.innerHTML = `
                    <div class="card text-center card-clickable">
                        <div class="card-body">
                            <div class="card-select">
                                <input type="checkbox" id="select-${pdf.id}" class="card-checkbox" data-id="${pdf.id}">
                            </div>
                            <div style="display: flex; justify-content: center; align-items: center; height: 150px;">
                                <canvas id="pdf-thumbnail-${pdf.id}" width="350" height="350"></canvas>
                            </div>
                            <h5 class="card-title mt-3">${pdf.nome_pdf}</h5>
                        </div>
                        <div class="card mt-2">
                            <div class="card-body d-flex justify-content-between">
                                <button onclick="exibirPDF(${index})" class="btn btn-primary"> Ver PDF
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="renomearPDF(${pdf.id}, event)" class="btn btn-warning">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deletarPDF(${pdf.id}, event)" class="btn btn-danger">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                listaPDFs.appendChild(card);

                const pdfUrl = `/pecaspdf/${pdf.id}`;
                renderizarMiniaturaPDF(pdfUrl, `pdf-thumbnail-${pdf.id}`);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar PDFs:', error);
            alert('Erro ao carregar a lista de PDFs.');
        });
}



function renderizarMiniaturaPDF(pdfUrl, canvasId) {
    const loadingTask = pdfjsLib.getDocument(pdfUrl);

    loadingTask.promise.then(function (pdf) {
        // Carrega a primeira página do PDF
        pdf.getPage(1).then(function (page) {
            const scale = 0.2;  // Defina a escala para a miniatura
            const viewport = page.getViewport({ scale: scale });

            const canvas = document.getElementById(canvasId);
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Renderiza a página no contexto do canvas
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            page.render(renderContext);
        });
    }).catch(function (error) {
        console.error('Erro ao renderizar o PDF:', error);
    });
}

let pdfs = [];
let currentPdfIndex = -1;

function exibirPDF(index) {
    if (index < 0 || index >= pdfs.length) {
        console.error('Índice de PDF inválido:', index);
        return;
    }

    currentPdfIndex = index;
    const pdf = pdfs[index];
    const pdfId = pdf.id;
    const pdfName = pdf.name;

    // Atualiza o iframe com o PDF
    document.getElementById('pdfViewer').setAttribute('src', `/pecaspdf/${pdfId}`);

    // Atualiza o nome do PDF
    document.getElementById('pdfName').textContent = pdfName;

    // Atualiza a contagem do PDF
    document.getElementById('pdfCount').textContent = `${currentPdfIndex + 1}/${pdfs.length}`;

    // Mostra o modal
    $('#pdfModal').modal('show');

    // Atualiza os botões de navegação
    toggleNavigationButtons();
}
function navigatePDF(direction) {
    const newIndex = currentPdfIndex + direction;

    if (newIndex >= 0 && newIndex < pdfs.length) {
        exibirPDF(newIndex);
    }
}

function toggleNavigationButtons() {
    document.getElementById('prevPdf').style.display = currentPdfIndex > 0 ? 'inline-block' : 'none';
    document.getElementById('nextPdf').style.display = currentPdfIndex < pdfs.length - 1 ? 'inline-block' : 'none';
}
// Carregar os representantes quando a página carregar
document.addEventListener('DOMContentLoaded', carregarRepresentantes);
function renomearPDF(id, event) {
    event.stopPropagation();

    // Obtém o ID do representante selecionado
    const representanteSelect = document.getElementById('representante');
    const representanteId = representanteSelect.value;

    // Verifica se um representante foi selecionado
    if (!representanteId) {
        alert('Por favor, selecione um representante.');
        return;
    }

    // Obtém o nome do representante selecionado
    const representanteNome = representanteSelect.options[representanteSelect.selectedIndex].text;

    // Solicita o número ao usuário
    const numero = prompt("Digite o número do PDF (exemplo: 01):");

    if (numero) {
        // Formata o novo nome do PDF
        const novoNome = `${numero} - ${representanteNome}.pdf`.trim();

        fetch(`/pecaspdf/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ novoNome })
        })
            .then(response => {
                if (response.ok) {
                    alert('Nome do PDF atualizado com sucesso.');
                    carregarPDFs(); // Recarrega a lista de PDFs para refletir a mudança
                } else {
                    return response.text(); // Para obter a mensagem de erro
                }
            })
            .then(errorMessage => {
                if (errorMessage) {
                    alert('Erro ao renomear o PDF: ' + errorMessage);
                }
            })
            .catch(error => {
                console.error('Erro ao renomear o PDF:', error);
                alert('Erro ao renomear o PDF.');
            });
    }
}
function deletarPDF(id, event) {
    event.stopPropagation();
    if (confirm("Tem certeza que deseja deletar este PDF?")) {
        fetch(`/pecaspdf/${id}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (response.ok) {
                    alert('PDF deletado com sucesso.');
                    carregarPDFs(); // Recarrega a lista de PDFs para refletir a mudança
                } else {
                    alert('Erro ao deletar o PDF.');
                }
            })
            .catch(error => {
                console.error('Erro ao deletar o PDF:', error);
                alert('Erro ao deletar o PDF.');
            });
    }
}

// Função para baixar PDFs
function baixarPDFs() {
    const lote = document.getElementById('loteDownload').value;
    const option = document.getElementById('downloadOption').value;

    if (!lote) {
        alert('Por favor, selecione um lote antes de prosseguir.');
        return;
    }

    // Captura os IDs dos representantes selecionados
    const checkboxes = document.querySelectorAll('#checkboxContainer input[type="checkbox"]:checked');
    const representanteIds = Array.from(checkboxes).map(checkbox => checkbox.value);

    const queryParams = new URLSearchParams({
        lote: lote,
        representante_ids: representanteIds.join(','),
        option: option
    });

    const downloadUrl = `/download-pecaspdf?${queryParams.toString()}`;
    window.location.href = downloadUrl; // Redireciona para o download
}

function carregarRepresentantesComoCheckboxes() {
    fetch('/representantes')
        .then(response => response.json())
        .then(data => {
            const checkboxContainer = document.getElementById('checkboxContainer');
            checkboxContainer.innerHTML = ''; // Limpa checkboxes anteriores

            data.forEach(representante => {
                const checkboxWrapper = document.createElement('div');
                checkboxWrapper.className = 'col-4'; // Coloca 3 checkboxes por linha

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = representante.id;
                checkbox.id = `rep_${representante.id}`;
                checkbox.name = 'representantes';

                const label = document.createElement('label');
                label.htmlFor = `rep_${representante.id}`;
                label.appendChild(document.createTextNode(representante.nome));

                checkboxWrapper.appendChild(checkbox);
                checkboxWrapper.appendChild(label);
                checkboxContainer.appendChild(checkboxWrapper);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar representantes:', error);
            alert('Erro ao carregar a lista de representantes.');
        });
}

function mostrarCheckboxes() {
    const downloadOption = document.getElementById('downloadOption').value;
    const checkboxContainer = document.getElementById('representantesCheckboxes');

    if (downloadOption === 'unify' || downloadOption === 'zip') {
        checkboxContainer.style.display = 'block';
        carregarRepresentantesComoCheckboxes(); // Carrega os checkboxes dos representantes
    } else {
        checkboxContainer.style.display = 'none';
    }
}

function carregarLotesParaDownload() {
    fetch('/api/lote')
        .then(response => response.json())
        .then(lotes => {
            const loteSelect = document.getElementById('loteDownload');
            loteSelect.innerHTML = '<option value="">Todos</option>'; // Opção padrão

            lotes.forEach(lote => {
                const option = document.createElement('option');
                option.value = lote.nome; // Ou outro identificador único do lote
                option.text = lote.nome;
                loteSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar lotes:', error));
}

$('#downloadModal').on('show.bs.modal', function () {
    carregarLotesParaDownload(); // Agora também carrega os lotes
});


function carregarFotos() {
    const representanteId = document.getElementById('representante').value;
    const loteId = document.getElementById('lote').value;
    const pdfsPorLinha = document.getElementById('pdfsPorLinha').value;
    const url = representanteId ? `/pecasfoto?representante_id=${representanteId}&lote_id=${loteId}` : '/pecasfoto';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const listaPhotos = document.getElementById('lista-photos');
            listaPhotos.innerHTML = '';

            if (data.length > 0) {
                document.getElementById('foto-section-wrapper').style.display = 'block';
            }

            data.forEach(photo => {
                const card = document.createElement('div');
                card.className = `col-md-${12 / pdfsPorLinha} mb-4`;

                card.innerHTML = `
                   <div class="card">
    <div class="card-body">
        <h5 class="card-title">${photo.nome_foto}</h5>
        <div class="d-flex justify-content-between">
            <button onclick="exibirFOTO('/pecasfoto/${photo.id}')" class="btn btn-primary btn-md me-2">
                <i class="fas fa-eye"></i> Ver Foto
            </button>
            <button onclick="renomearFOTO(${photo.id})" class="btn btn-warning btn-md me-2 edit-button">
                <i class="fas fa-edit"></i> 
            </button>
            <button onclick="deletarFOTO(${photo.id})" class="btn btn-danger btn-md edit-button">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    </div>
</div>

                `;

                listaPhotos.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar FOTOS:', error);
            alert('Erro ao carregar a lista de FOTOS.');
        });
}

function atualizarLotes() {
    const representanteNome = document.getElementById('representante').selectedOptions[0].text; // Obtém o nome do representante
    console.log('Representante:', representanteNome); // Log do nome do representante

    if (!representanteNome) {
        document.getElementById('lote').innerHTML = '<option value="">Todos</option>';
        atualizarDados(); // Carrega todos PDFs e fotos se "Todos" estiver selecionado
        return;
    }

    const url = `/api/lotes?representante=${encodeURIComponent(representanteNome)}`;
    console.log('URL da solicitação:', url); // Log da URL

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log('Dados recebidos:', data); // Log dos dados recebidos

            const loteSelect = document.getElementById('lote');
            loteSelect.innerHTML = '<option value="">Todos</option>'; // Reseta os lotes

            if (!Array.isArray(data) || data.length === 0) {
                loteSelect.innerHTML += '<option value="">Nenhum lote encontrado</option>';
                return;
            }

            data.forEach(lote => {
                const option = document.createElement('option');
                option.value = lote.lote;
                option.textContent = lote.lote;
                loteSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar lotes:', error);
            alert('Erro ao carregar a lista de lotes.');
        });
}

function atualizarDados() {
    carregarFotos();
    carregarPDFs();
}


function exibirFOTO(url) {
    document.getElementById('photosViewer').setAttribute('src', url); // Define a URL da imagem grande
    $('#photosModal').modal('show'); // Abre o modal com a imagem grande
    
    // Atualiza a lista de fotos e o índice atual, caso tenha várias fotos
    currentPdfIndex = photos.findIndex(photo => photo.url === url);
}

// Carregar os representantes quando a página carregar
document.addEventListener('DOMContentLoaded', carregarRepresentantes);
function renomearFOTO(id) {
    const novoNome = prompt("Digite o novo nome para a FOTO:");
    if (novoNome) {
        let trimmedNome = novoNome.trim();

        // Adiciona a extensão .pdf se não estiver presente
        if (!trimmedNome.toLowerCase().endsWith('.jpg')) {
            trimmedNome += '.jgp';
        }

        fetch(`/pecasfoto/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ novoNome: trimmedNome })
        })
            .then(response => {
                if (response.ok) {
                    alert('Nome da FOTO atualizado com sucesso.');
                    carregarFotos(); // Recarrega a lista de PDFs para refletir a mudança
                } else {
                    return response.text(); // Para obter a mensagem de erro
                }
            })
            .then(errorMessage => {
                if (errorMessage) {
                    alert('Erro ao renomear a FOTO: ' + errorMessage);
                }
            })
            .catch(error => {
                console.error('Erro ao renomear a FOTO:', error);
                alert('Erro ao renomear a FOTO.');
            });
    }
}

function deletarFOTO(id) {
    if (confirm("Tem certeza que deseja deletar esta FOTO?")) {
        fetch(`/pecasfoto/${id}`, {
            method: 'DELETE',
        })
            .then(response => {
                if (response.ok) {
                    alert('FOTO deletado com sucesso.');
                    carregarFotos(); // Recarrega a lista de PDFs para refletir a mudança
                } else {
                    alert('Erro ao deletar o FOTO.');
                }
            })
            .catch(error => {
                console.error('Erro ao deletar o FOTO:', error);
                alert('Erro ao deletar o FOT.');
            });
    }
}

document.getElementById('deleteSelected').addEventListener('click', function() {
    const selectedCheckboxes = document.querySelectorAll('.card-checkbox:checked');
    const ids = Array.from(selectedCheckboxes).map(checkbox => checkbox.dataset.id);

    if (ids.length === 0) {
        alert('Nenhum PDF selecionado para exclusão.');
        return;
    }

    if (confirm('Tem certeza de que deseja excluir os PDFs selecionados?')) {
        ids.forEach(id => {
            fetch(`/pdfs/${id}`, {
                method: 'DELETE'
            })
            .then(response => response.text())
            .then(message => {
                console.log(message); // Exibe mensagem de sucesso
                // Remove o card do DOM após a exclusão
                const card = document.querySelector(`.card-checkbox[data-id="${id}"]`).closest('.card-clickable');
                card.parentElement.remove();
            })
            .catch(error => {
                console.error('Erro ao excluir o PDF:', error);
                alert('Erro ao excluir o PDF.');
            });
        });
        
        // Esconde a barra de ações após a exclusão
        atualizarBarraDeAcoes();
    }
});
