document.addEventListener('DOMContentLoaded', function() {
    loadRepresentantes();
});

function loadRepresentantes() {
    fetch('/api/representantes')
        .then(response => response.json())
        .then(representantes => {
            // Ordenar os representantes por nome
            representantes.sort((a, b) => a.nome.localeCompare(b.nome));

            const representantesList = document.getElementById('representantes-buttons');
            representantesList.innerHTML = ''; // Limpar a lista existente

            let row;
            representantes.forEach((rep, index) => {
                // Criar uma nova linha a cada 4 botões
                if (index % 50 === 0) {
                    row = document.createElement('div');
                    row.className = 'row mb-3'; // Linha para os botões
                    representantesList.appendChild(row);
                }
                
                // Criar o botão
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-info btn-lg btn-block'; // Ajustar o estilo do botão
                button.textContent = rep.nome;
                button.dataset.toggle = 'modal';
                button.dataset.target = `#representante${rep.id}Modal`;
                button.dataset.id = rep.id;  // Adicionar o ID como dado do botão
                button.addEventListener('click', () => fetchPecasData(rep.id));

                // Colocar o botão dentro de uma coluna para a grid
                const col = document.createElement('div');
                col.className = 'col-12 col-sm-6 col-md-4 col-lg-3 mb-3'; // Ajustar colunas para 4 por linha
                col.appendChild(button);

                row.appendChild(col);
                
                // Criar o modal
                const modal = document.createElement('div');
                modal.className = 'modal fade';
                modal.id = `representante${rep.id}Modal`;
                modal.tabIndex = '-1';
                modal.role = 'dialog';
                modal.setAttribute('aria-labelledby', `representante${rep.id}ModalLabel`);
                modal.setAttribute('aria-hidden', 'true');
                modal.innerHTML = `
                    <div class="modal-dialog modal-dialog-scrollable" role="document">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="representante${rep.id}ModalLabel">Peças de ${rep.nome}</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Clientes</th>
                                            <th>Tipo</th>
                                            <th>Modelo</th>
                                            <th>Código</th>
                                            <th>Quantidade</th>
                                        </tr>
                                    </thead>
                                    <tbody id="modal-rep-pecas-${rep.id}">
                                        <!-- Dados das peças serão preenchidos dinamicamente -->
                                    </tbody>
                                </table>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-dismiss="modal">Fechar</button>
                            </div>
                        </div>
                    </div>
                `;
                document.getElementById('representantes-modals').appendChild(modal);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}

function fetchPecasData(id) {
    fetch(`/api/representantes/${id}/pecas`)
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById(`modal-rep-pecas-${id}`);
            tbody.innerHTML = ''; // Limpar qualquer dado anterior
            data.forEach(peca => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${peca.clientes}</td>
                    <td>${peca.tipo}</td>
                    <td>${peca.modelo}</td>
                    <td>${peca.codigo}</td>
                    <td>${peca.quantidade}</td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching data:', error));
}
