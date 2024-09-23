const rowsPerPage = 10;
let currentPage = 1;
let totalPages = 1;
let data = []; // Dados reais

// Função para carregar lotes no select
async function loadLote() {
    try {
        const response = await fetch('/api/lote');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const lotes = await response.json();

        const loteSelect = document.querySelector('#lote-select');
        loteSelect.innerHTML = '<option value="">Todos</option>'; // Opção padrão

        lotes.forEach(lote => {
            const option = document.createElement('option');
            option.value = lote.nome;
            option.textContent = lote.nome;
            loteSelect.appendChild(option);
        });

        // Defina o lote 29 como selecionado ao carregar a página
        loteSelect.value = 'lote 30'; // Defina o valor para 29
        updateTables(); // Atualiza as tabelas com base no lote 29 selecionado
    } catch (error) {
        console.error('Erro ao carregar lotes:', error);
    }
}

// Atualize a função fetchData para aceitar lote como parâmetro
async function fetchData(lote = '') {
    try {
        const response = await fetch(`/api/pecas/resumo?lote=${encodeURIComponent(lote)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        const tableBody = document.querySelector('#pecas-table tbody');
        tableBody.innerHTML = ''; // Limpa o corpo da tabela antes de adicionar novas linhas

        data.forEach(item => {
            const representanteNome = item.representante_nome || 'Desconhecido'; 

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${representanteNome}</td>
                <td>${item.total_pecas}</td>
                <td>${parseFloat(item.valor_total).toFixed(2)}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Erro ao buscar dados:', error);
    }
}

// Atualize a função fetchResumoPorTipo para aceitar lote como parâmetro
async function fetchResumoPorTipo(tipoPeca = '') {
    const loteSelecionado = document.querySelector('#lote-select').value;
    try {
        const response = await fetch(`/api/pecas/resumo-por-tipo?tipo=${encodeURIComponent(tipoPeca)}&lote=${encodeURIComponent(loteSelecionado)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        data = await response.json();
        totalPages = Math.ceil(data.length / rowsPerPage);
        renderTable();
    } catch (error) {
        console.error('Erro ao buscar dados (Resumo por Tipo):', error);
    }
}

function renderTable() {
    const tableBody = document.querySelector('#pecas-tipo-body');
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginatedData = data.slice(start, end);

    tableBody.innerHTML = ''; // Limpa o corpo da tabela antes de adicionar novas linhas
    paginatedData.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.representante_nome || 'Desconhecido'}</td>
            <td>${item.tipo_peca}</td>
            <td>${item.total_pecas}</td>
            <td>${parseFloat(item.valor_total).toFixed(2)}</td>
        `;
        tableBody.appendChild(row);
    });

    renderPaginationControls();
}

function renderPaginationControls() {
    const paginationControls = document.querySelector('#pagination-controls');
    paginationControls.innerHTML = '';

    // Se houver apenas uma página, não exibe os controles de paginação
    if (totalPages <= 1) {
        paginationControls.style.display = 'none';
        return;
    } else {
        paginationControls.style.display = 'block';
    }

    if (currentPage > 1) {
        paginationControls.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(event, ${currentPage - 1})">Anterior</a></li>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        paginationControls.innerHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="changePage(event, ${i})">${i}</a></li>`;
    }

    if (currentPage < totalPages) {
        paginationControls.innerHTML += `<li class="page-item"><a class="page-link" href="#" onclick="changePage(event, ${currentPage + 1})">Próxima</a></li>`;
    }
}

function changePage(event, page) {
    event.preventDefault(); // Impede o comportamento padrão do link
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderTable();
}

// Função para atualizar as tabelas com base na seleção do tipo de peça e lote
function updateTables(tipoPeca = '') {
    const loteSelecionado = document.querySelector('#lote-select').value;
    fetchResumoPorTipo(tipoPeca); // Atualiza a tabela de resumo por tipo
    fetchData(loteSelecionado); // Atualiza a tabela geral com base no lote selecionado
}

// Atualize a tabela quando o lote for selecionado
document.querySelector('#lote-select').addEventListener('change', () => {
    updateTables(); // Atualiza as tabelas com base no lote selecionado e no tipo de peça atual
});

document.addEventListener('DOMContentLoaded', () => {
    loadLote(); // Carrega os lotes e define o lote 29 como selecionado
    // Atualiza as tabelas com base no lote selecionado ao carregar a página
    updateTables(); // Certifique-se de que as tabelas sejam atualizadas com base na seleção inicial
});
