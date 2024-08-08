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
const url = representanteId ? `/pdfs?representante_id=${representanteId}` : '/pdfs';

fetch(url)
    .then(response => response.text())
    .then(data => {
        document.getElementById('lista-pdfs').innerHTML = data;
    })
    .catch(error => {
        console.error('Erro ao carregar PDFs:', error);
        alert('Erro ao carregar a lista de PDFs.');
    });
}

function exibirPDF(url) {
    document.getElementById('pdfViewer').setAttribute('src', url);
    $('#pdfModal').modal('show'); // Mostrar o modal
}

// Carregar os representantes quando a página carregar
document.addEventListener('DOMContentLoaded', carregarRepresentantes);
