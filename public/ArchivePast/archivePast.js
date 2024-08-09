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
                            <button onclick="renomearPDF(${pdf.id})" class="btn btn-warning">Renomear</button>
                            <button onclick="deletarPDF(${pdf.id})" class="btn btn-danger">Deletar</button>
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




function exibirPDF(url) {
    document.getElementById('pdfViewer').setAttribute('src', url);
    $('#pdfModal').modal('show'); // Mostrar o modal
}

// Carregar os representantes quando a página carregar
document.addEventListener('DOMContentLoaded', carregarRepresentantes);


function renomearPDF(id) {
    const novoNome = prompt("Digite o novo nome para o PDF:");
    if (novoNome) {
        fetch(`/pdfs/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ novoNome: novoNome })
        })
        .then(response => {
            if (response.ok) {
                alert('Nome do PDF atualizado com sucesso.');
                carregarPDFs(); // Recarrega a lista de PDFs para refletir a mudança
            } else {
                alert('Erro ao renomear o PDF.');
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
