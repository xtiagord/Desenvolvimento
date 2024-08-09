document.addEventListener('DOMContentLoaded', function() {
    fetch('/api/representantes')
        .then(response => response.json())
        .then(representantes => {
            const select = document.getElementById('representanteSelect');
            representantes.forEach(representante => {
                const option = document.createElement('option');
                option.value = representante.id;
                option.textContent = representante.nome;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar representantes:', error));
});
const pdfIdInput = document.getElementById('pdfIdInput'); // Certifique-se de que o id do input está correto
const representanteIdInput = document.getElementById('representanteIdInput'); // Certifique-se de que o id do input está correto
async function uploadFile(file, folderName) {
const formData = new FormData();
formData.append('file', file);
formData.append('npdf_id', pdfIdInput ? pdfIdInput.value : ''); // Verifica se pdfIdInput está definido
formData.append('representante_id', representanteIdInput ? representanteIdInput.value : ''); // Verifica se representanteIdInput está definido
formData.append('folder_name', folderName);

const response = await fetch('/upload', {
    method: 'POST',
    body: formData,
});

if (!response.ok) {
    console.error('Falha ao fazer upload do arquivo');
}
}

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
    const pdfsPorLinha = document.getElementById('pdfsPorLinha').value;
    const url = representanteId ? `/pdfs?representante_id=${representanteId}` : '/pdfs';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const listaPDFs = document.getElementById('lista-pdfs');
            listaPDFs.innerHTML = '';

            data.forEach(pdf => {
                const card = document.createElement('div');
                card.className = `col-md-${12 / pdfsPorLinha} mb-4`; // Calcula a largura com base na seleção

                card.innerHTML = `
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">${pdf.name}</h5>
                            <button onclick="exibirPDF('/pdfs/${pdf.id}')" class="btn btn-primary">Ver PDF</button>
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
let currentPdfIndex = 0;

function exibirPDF(url) {
    document.getElementById('pdfViewer').setAttribute('src', url);
    $('#pdfModal').modal('show'); // Mostrar o modal

    // Atualiza a lista de PDFs e o índice atual
    pdfs = []; // Inicializar ou atualizar com a lista de PDFs
    currentPdfIndex = pdfs.findIndex(pdf => pdf.url === url);

    // Atualiza a visibilidade dos botões de navegação
    atualizarNavegacao();
}

function atualizarNavegacao() {
    document.getElementById('prevPdf').style.display = currentPdfIndex > 0 ? 'inline-block' : 'none';
    document.getElementById('nextPdf').style.display = currentPdfIndex < pdfs.length - 1 ? 'inline-block' : 'none';
}

function navigatePDF(direction) {
    // Calcula o novo índice
    const newIndex = currentPdfIndex + direction;

    if (newIndex >= 0 && newIndex < pdfs.length) {
        currentPdfIndex = newIndex;
        const newPdf = pdfs[currentPdfIndex];
        document.getElementById('pdfViewer').setAttribute('src', newPdf.url);
        atualizarNavegacao();
    }
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

// Função para carregar opções de representantes no modal de download
function carregarRepresentantesParaDownload() {
    fetch('/api/representantes') // Ajuste o endpoint se necessário
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('representanteDownload');
            select.innerHTML = '<option value="">Todos</option>'; // Adicionar opção "Todos"

            data.forEach(rep => {
                const option = document.createElement('option');
                option.value = rep.id;
                option.textContent = rep.nome;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar representantes:', error));
}

// Função para baixar PDFs
function baixarPDFs() {
    const downloadOption = document.getElementById('downloadOption').value;
    const representantesSelecionados = Array.from(document.querySelectorAll('input[name="representantes"]:checked'))
        .map(checkbox => checkbox.value);
    
    let url = '/download-pdfs?';

    if (representantesSelecionados.length > 0) {
        url += `representante_ids=${representantesSelecionados.join(',')}&`;
    }

    url += `option=${downloadOption}`;

    window.location.href = url; // Inicia o download
}



// Chama a função para carregar representantes ao abrir o modal
$('#downloadModal').on('show.bs.modal', carregarRepresentantesParaDownload);


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

