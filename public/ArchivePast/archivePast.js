document.addEventListener('DOMContentLoaded', function() {
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

document.getElementById('representanteSelect').addEventListener('change', function() {
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
        loteSelect.addEventListener('focus', function() {
            emptyOption.disabled = true;
        });
    })
    .catch(error => console.error('Erro ao carregar lotes:', error));
});


document.getElementById('loteSelect').addEventListener('change', function() {
    const representante = document.getElementById('representanteSelect').options[document.getElementById('representanteSelect').selectedIndex].text;
    const lote = this.value;
    const npdfSelect = document.getElementById('npdfSelect');   
    npdfSelect.innerHTML = '';  // Limpar opções anteriores de Npdfs
    fetch(`/api/npdfs?representante=${encodeURIComponent(representante)}&lote=${encodeURIComponent(lote)}`)
        .then(response => response.json())
        .then(npdfs => {
            npdfs.forEach(npdf => {
                const option = document.createElement('option');
                option.value = npdf.Npdf;
                option.textContent = npdf.Npdf;
                npdfSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar Npdfs:', error));
});
document.getElementById('uploadForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const formData = new FormData();
    const pdfFiles = document.getElementById('pdfFiles').files;
    const photoFiles = document.getElementById('photoFiles').files;
    const representanteId = document.getElementById('representanteSelect').value;
    const lote = document.getElementById('loteSelect').value;
    const npdf = document.getElementById('npdfSelect').value;

    console.log('Representante selecionado:', representanteId);
    console.log('Lote selecionado:', lote);
    console.log('Npdf selecionado:', npdf);

    Array.from(pdfFiles).forEach(file => {
        formData.append('pdfFiles', file);
    });

    Array.from(photoFiles).forEach(file => {
        formData.append('photoFiles', file);
    });

    formData.append('representanteId', representanteId);
    formData.append('lote', lote);
    formData.append('npdf', npdf);

    try {
        const response = await fetch('/upload', {
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

function carregarPDFs() {
    const representanteId = document.getElementById('representante').value;
    const loteId = document.getElementById('lote').value;
    const pdfsPorLinha = document.getElementById('pdfsPorLinha').value;
    const url = representanteId ? `/pdfs?representante_id=${representanteId}&lote_id=${loteId}` : '/pdfs';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            pdfs = data; // Salvar a lista de PDFs carregados
            const listaPDFs = document.getElementById('lista-pdfs');
            listaPDFs.innerHTML = '';

            data.forEach((pdf, index) => {
                const card = document.createElement('div');
                card.className = `col-md-${12 / pdfsPorLinha} mb-4`;

                card.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${pdf.name}</h5>
                            <button onclick="exibirPDF(${index})" class="btn btn-primary">Ver PDF</button>
                            <button onclick="renomearPDF(${pdf.id})" class="btn btn-warning edit-button">Renomear</button>
                            <button onclick="deletarPDF(${pdf.id})" class="btn btn-danger edit-button">Deletar</button>
                        </div>
                    </div>
                `;

                listaPDFs.appendChild(card);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar PDFs:', error);
            alert('Erro ao carregar a lista de PDFs.');
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
    document.getElementById('pdfViewer').setAttribute('src', `/pdfs/${pdfId}`);
    
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
function renomearPDF(id) {
    const novoNome = prompt("Digite o novo nome para o PDF:");
    if (novoNome) {
        let trimmedNome = novoNome.trim();

        // Adiciona a extensão .pdf se não estiver presente
        if (!trimmedNome.toLowerCase().endsWith('.pdf')) {
            trimmedNome += '.pdf';
        }

        fetch(`/pdfs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ novoNome: trimmedNome })
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
function deletarPDF(id) {
    if (confirm("Tem certeza que deseja deletar este PDF?")) {
        fetch(`/pdfs/${id}`, {
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
let editButtonsVisible = false;
function toggleEditButtons() {
    editButtonsVisible = !editButtonsVisible; // Alterna o estado
    const editButtons = document.querySelectorAll('.edit-button');
    editButtons.forEach(button => {
        button.classList.toggle('d-none', !editButtonsVisible); // Aplica a visibilidade com base no estado
    });
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
    
    const downloadUrl = `/download-pdfs?${queryParams.toString()}`;
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
    const url = representanteId ? `/photos?representante_id=${representanteId}&lote_id=${loteId}` : '/photos';

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
                            <h5 class="card-title">${photo.name}</h5>
                            <button onclick="exibirFOTO('/photos/${photo.id}')" class="btn btn-primary">Ver Foto</button>
                            <button onclick="renomearFOTO(${photo.id})" class="btn btn-warning edit-button">Renomear</button>
                            <button onclick="deletarFOTO(${photo.id})" class="btn btn-danger edit-button">Deletar</button>
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
    document.getElementById('photosViewer').setAttribute('src', url);
    $('#photosModal').modal('show'); // Mostrar o modal
    // Atualiza a lista de fotos e o índice atual
    photos = []; // Inicializar ou atualizar com a lista de fotos
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

        fetch(`/photos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ novoNome: trimmedNome })
        })
        .then(response => {
            if (response.ok) {
                alert('Nome da FOTO atualizado com sucesso.');
                carregarPDFs(); // Recarrega a lista de PDFs para refletir a mudança
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
        fetch(`/photos/${id}`, {
            method: 'DELETE',
        })
        .then(response => {
            if (response.ok) {
                alert('FOTO deletado com sucesso.');
                carregarPDFs(); // Recarrega a lista de PDFs para refletir a mudança
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

