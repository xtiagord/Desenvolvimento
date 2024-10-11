document.addEventListener('DOMContentLoaded', function () {
  // Função para formatar valores como moeda brasileira
  function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Função para ajustar os valores para exibição
  function adjustValues(value) {
    return parseFloat(value).toFixed(2); // Garante que o valor é um número decimal com duas casas decimais
  }

  // Buscar dados de VALOR somados por lote
  fetch('/api/valor-lotes')
    .then(response => response.json())
    .then(data => {
      console.log('Dados recebidos de valor e lote:', data);

      const lotes = data.map(item => `Lote ${item.lote}`);
      const totalValor = data.map(item => adjustValues(item.totalValor));

      console.log('Lotes:', lotes);
      console.log('Total Valor:', totalValor);

      const ctxValorLote = document.getElementById('lotevalorComparisonChart').getContext('2d');
      new Chart(ctxValorLote, {
        type: 'bar',
        data: {
          labels: lotes,
          datasets: [{
            label: 'valor por Lote',
            data: totalValor,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Erro ao carregar dados de valor e lote:', error);
    });



  // Buscar dados dos representantes com kg e valor
  fetch('/api/representantes-com-kg-e-valor')
    .then(response => response.json())
    .then(data => {
      console.log('Dados recebidos dos representantes com kg e valor:', data);

      const representantes = data.map(item => item.nome);
      const kg = data.map(item => item.kg);
      const valorTotal = data.map(item => adjustValues(item.valorTotal)); // Ajusta os valores

      console.log('Representantes:', representantes);
      console.log('Kg:', kg);
      console.log('Valor Total:', valorTotal);

      const ctxKg = document.getElementById('representantesChartKg').getContext('2d');
      new Chart(ctxKg, {
        type: 'bar',
        data: {
          labels: representantes,
          datasets: [{
            label: 'Kg por Representante',
            data: kg,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });

      const ctxValor = document.getElementById('representantesChartValor').getContext('2d');
      new Chart(ctxValor, {
        type: 'bar',
        data: {
          labels: representantes,
          datasets: [{
            label: 'Valor Total por Representante',
            data: valorTotal,
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
          }]
        },
        options: {
          plugins: {
            datalabels: {
              formatter: function (value, context) {
                return formatCurrency(parseFloat(value)); // Formata o valor como moeda
              },
              color: '#000',
              anchor: 'end',
              align: 'top',
              offset: 4
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return formatCurrency(value);
                }
              }
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Erro ao carregar dados dos representantes com kg e valor:', error);
    });

  // Buscar dados de kg somados por lote
  fetch('/api/kg-e-lote')
    .then(response => response.json())
    .then(data => {
      console.log('Dados recebidos de kg e lote:', data);

      const lotes = data.map(item => `Lote ${item.lote}`);
      const totalKg = data.map(item => adjustValues(item.totalKg));

      console.log('Lotes:', lotes);
      console.log('Total Kg:', totalKg);

      const ctxKgLote = document.getElementById('loteComparisonChart').getContext('2d');
      new Chart(ctxKgLote, {
        type: 'bar',
        data: {
          labels: lotes,
          datasets: [{
            label: 'Kg por Lote',
            data: totalKg,
            backgroundColor: 'rgba(255, 165, 0, 0.2)', // Cor de fundo das barras (laranja com transparência)
            borderColor: 'rgba(255, 165, 0, 1)', // Cor da borda das barras (laranja)
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    })
    .catch(error => {
      console.error('Erro ao carregar dados de kg e lote:', error);
    });
});


// Função para ajustar o tamanho do gráfico
function resizeChart(chartId, action) {
  const chartBox = document.querySelector(`#${chartId}`).closest('.chart-box');
  if (chartBox) {
    if (action === 'increase') {
      chartBox.classList.add('full-width');
    } else if (action === 'decrease') {
      chartBox.classList.remove('full-width');
    }
  } else {
    console.error(`O contêiner do gráfico com ID ${chartId} não foi encontrado.`);
  }
  function resizeChart(chartId, action) {
    const chartElement = document.getElementById(chartId);
    if (action === 'increase') {
      chartElement.style.width = (chartElement.offsetWidth * 1.1) + 'px';
      chartElement.style.height = (chartElement.offsetHeight * 1.1) + 'px';
    } else if (action === 'decrease') {
      chartElement.style.width = (chartElement.offsetWidth * 0.9) + 'px';
      chartElement.style.height = (chartElement.offsetHeight * 0.9) + 'px';
    }
    myChart.resize(); // Redimensiona a instância do gráfico
  }
}
// Função para salvar a ordem dos cards
function saveCardOrder(order) {
  const userId = 1; // Substitua pelo ID do usuário apropriado

  fetch('/api/saveCardOrder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ user_id: userId, order }) // Inclua user_id aqui
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log('Ordem salva com sucesso:', data);
      } else {
        console.error('Erro ao salvar a ordem:', data.error);
      }
    })
    .catch(error => {
      console.error('Erro ao salvar a ordem:', error);
    });
}

// Inicialização do SortableJS para permitir arrastar e reorganizar
document.addEventListener('DOMContentLoaded', () => {
  const sortableElement = document.getElementById('sortable-chart-row');
  if (sortableElement) {
    Sortable.create(sortableElement, {
      animation: 150,
      handle: '.card-body',
      draggable: '.card',
      onStart: function (evt) {
        evt.item.classList.add('dragging');
      },
      onEnd: function (evt) {
        evt.item.classList.remove('dragging');
        // Captura a nova ordem dos cards
        const newOrder = Array.from(sortableElement.children)
          .map(child => child.id)
          .filter(id => id); // Filtra IDs vazios
        console.log('Nova ordem:', newOrder);
        // Salva a nova ordem
        saveCardOrder(newOrder);
      },
    });
  } else {
    console.error('Elemento com id "sortable-chart-row" não encontrado.');
  }
});

// Carregar a ordem dos cards ao iniciar a página
document.addEventListener('DOMContentLoaded', () => {
  const userId = 1; // Substitua pelo ID do usuário apropriado
  fetch(`/api/getCardOrder?user_id=${userId}`)
    .then(response => response.json())
    .then(data => {
      const savedOrder = data.order;
      if (savedOrder && Array.isArray(savedOrder)) {
        const sortableElement = document.getElementById('sortable-chart-row');
        if (sortableElement) {
          const cards = savedOrder.map(id => document.getElementById(id));
          cards.forEach(card => {
            if (card) {
              sortableElement.appendChild(card);
            } else {
              console.error(`Card com id "${id}" não encontrado.`);
            }
          });
        } else {
          console.error('Elemento com id "sortable-chart-row" não encontrado.');
        }
      } else {
        console.error('Dados de ordem inválidos recebidos:', data);
      }
    })
    .catch(error => {
      console.error('Erro ao recuperar a ordem dos cards:', error);
    });
});

let currentChartType = 'mediaPd'; // Tipo de gráfico padrão
let myChart;

function updateChartType() {
  currentChartType = document.getElementById('chartTypeSelector').value;
  updateChartData();
}

function updateChartData() {
  fetch(`/api/media`)
    .then(response => response.json())
    .then(data => {
      let chartData = [];
      if (currentChartType === 'mediaPd') {
        chartData = data.map(item => ({
          representante: item.representante,
          media: item.mediaPd
        }));
      } else if (currentChartType === 'mediaRh') {
        chartData = data.map(item => ({
          representante: item.representante,
          media: item.mediaRh
        }));
      } else if (currentChartType === 'mediaPt') {
        chartData = data.map(item => ({
          representante: item.representante,
          media: item.mediaPt
        }));
      }
      updateChart(chartData);
    })
    .catch(error => console.error('Erro ao buscar dados:', error));
}

function updateChart(chartData) {
  const labels = chartData.map(item => item.representante);
  const data = chartData.map(item => item.media);

  if (myChart) {
    myChart.destroy(); // Destrói a instância anterior do gráfico
  }

  const ctx = document.getElementById('representantesChartMedia').getContext('2d');
  myChart = new Chart(ctx, {
    type: 'bar', // ou 'line', 'pie', etc.
    data: {
      labels: labels,
      datasets: [{
        label: getChartLabel(),
        data: data,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function getChartLabel() {
  if (currentChartType === 'mediaPd') {
    return 'Média PD';
  } else if (currentChartType === 'mediaRh') {
    return 'Média RH';
  } else if (currentChartType === 'mediaPt') {
    return 'Média PT';
  }
  return '';
}

function updateLoteChart() {
  const valueSelector = document.getElementById('chartTypeSelector');
  const selectedValue = valueSelector.value;

  fetch(`/api/mediaslote?value=${selectedValue}`)
    .then(response => response.json())
    .then(data => {
      console.log('Dados recebidos para médias por lote:', data);

      const labels = data.map(item => item.lote);
      const dataValues = data.map(item => item.totalValue);

      if (loteChart) {
        loteChart.destroy(); // Destroy the previous chart instance
      }

      const ctx = document.getElementById('lotemediaChartMedia').getContext('2d');
      loteChart = new Chart(ctx, {
        type: 'bar', // or 'line', 'pie', etc.
        data: {
          labels: labels,
          datasets: [{
            label: `Total ${selectedValue.toUpperCase()}`,
            data: dataValues,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    })
    .catch(error => console.error('Erro ao buscar dados de lote:', error));
}

// Carrega os dados ao iniciar a página
document.addEventListener('DOMContentLoaded', function () {
  updateChartData();
});

// Função para atualizar o conteúdo do primeiro card com a data e a hora atuais
function updateFirstCard() {
  const firstCard = document.getElementById('mini-card1');
  if (firstCard) {
    const titleElement = firstCard.querySelector('.card-title');
    const textElement = firstCard.querySelector('.card-text');

    // Atualizar título com a data atual
    const now = new Date();
    const dateString = now.toLocaleDateString(); // Ajuste o formato conforme necessário
    titleElement.textContent = `Data: ${dateString}`;

    // Atualizar texto com a hora atual
    const timeString = now.toLocaleTimeString(); // Formato de hora com segundos
    textElement.textContent = `Hora: ${timeString}`;
  }
}

async function updateSecondCard(loteId) {
  const secondCard = document.getElementById('mini-card2');
  
  if (secondCard) {
      const titleElement = secondCard.querySelector('.card-title');
      const textElement = secondCard.querySelector('.card-text');

      try {
          const response = await fetch(`/api/calcular-media/${loteId}`);
          if (!response.ok) throw new Error(`Erro na resposta da API: ${response.status}`);
          
          const data = await response.json();

          // Atualiza o card com o valor total
          titleElement.textContent = "Valor Total";
          textElement.textContent = parseFloat(data[0].soma_valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      } catch (error) {
          console.error('Erro ao atualizar o segundo card:', error);
          // Opcional: Adicionar mensagem de erro ao card
          titleElement.textContent = "Erro";
          textElement.textContent = "Não foi possível carregar o valor total.";
      }
  }
}

async function updateThirdCard(loteId) {
  const thirdCard = document.getElementById('mini-card3');
  
  if (thirdCard) {
      const titleElement = thirdCard.querySelector('.card-title');
      const textElement = thirdCard.querySelector('.card-text');

      try {
          const response = await fetch(`/api/calcular-media/${loteId}`);
          if (!response.ok) throw new Error(`Erro na resposta da API: ${response.status}`);
          
          const data = await response.json();

          // Atualiza o card com o valor total
          titleElement.textContent = "TOTAL KG";
          textElement.textContent = parseFloat(data[0].soma_total_kg).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      } catch (error) {
          console.error('Erro ao atualizar o segundo card:', error);
          // Opcional: Adicionar mensagem de erro ao card
          titleElement.textContent = "Erro";
          textElement.textContent = "Não foi possível carregar o valor total.";
      }
  }
}

async function updateFourCard(loteId) {
  const fourCard = document.getElementById('mini-card4');
  
  if (fourCard) {
      const titleElement = fourCard.querySelector('.card-title');
      const textElement = fourCard.querySelector('.card-text');

      try {
          const response = await fetch(`/api/calcular-media/${loteId}`);
          if (!response.ok) throw new Error(`Erro na resposta da API: ${response.status}`);
          
          const data = await response.json();

          // Atualiza o card com o valor total
          titleElement.textContent = "MEDIA POR KG";
          textElement.textContent = parseFloat(data[0].media_valor_por_kg).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      } catch (error) {
          console.error('Erro ao atualizar o segundo card:', error);
          titleElement.textContent = "Erro";
          textElement.textContent = "Não foi possível carregar o valor total.";
      }
  }
}

async function updateFiveCard(loteId) {
  const fiveCard = document.getElementById('mini-card5');

  if (fiveCard) {
    const titleElement = fiveCard.querySelector('.card-title');
    const textElement = fiveCard.querySelector('.card-text');

    try {
      // Passando o lote como uma query string
      const response = await fetch(`/api/representante-maior-valor?lote=${encodeURIComponent(loteId)}`);
      if (!response.ok) throw new Error(`Erro na resposta da API: ${response.status}`);

      const data = await response.json();

      if (data.length > 0) {
        const { representante, TotalValor } = data[0];

        // Log do valor original para depuração
        console.log("TotalValor original:", TotalValor);

        // Remover os pontos e vírgulas para garantir que a conversão funcione
        const valorLimpo = TotalValor.replace(/\./g, '').replace(',', '.');

        // Convertendo o valor para um número
        const valorNumerico = parseFloat(valorLimpo);

        if (!isNaN(valorNumerico)) {
          titleElement.textContent = "Representante com maior Valor";
          textElement.innerHTML = `
            <strong>${representante}</strong><br/>
            ${valorNumerico.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          `;
        } else {
          console.error("Erro: TotalValor não é um número válido.", TotalValor);
          titleElement.textContent = "Erro de Valor";
          textElement.innerHTML = "Valor inválido";
        }
      } else {
        titleElement.textContent = "Sem dados disponíveis";
        textElement.textContent = "";
      }
    } catch (error) {
      console.error('Erro ao atualizar quinto card:', error);
    }
  }
}

async function updateWeatherCard() {
  const card = document.getElementById('mini-card6');
  const titleElement = card.querySelector('.card-title');
  const textElement = card.querySelector('.card-text');

  try {
    const response = await fetch('/api/weather');
    if (!response.ok) throw new Error(`Erro na resposta da API: ${response.status}`);
    
    const data = await response.json();
    
    const temperature = data.current.temp_c;
    const weatherDescription = data.current.condition.text;
    
    titleElement.textContent = "Foz do Iguacu";
    textElement.innerHTML = `
        ${temperature}°C<br/>
        ${weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1)}
    `;
  } catch (error) {
    console.error('Erro ao atualizar card de clima:', error);
    titleElement.textContent = "Erro ao obter clima";
    textElement.textContent = "Não foi possível obter as informações do clima.";
  }
}



// Chame a função para atualizar o card quando a página carregar
document.addEventListener('DOMContentLoaded', updateWeatherCard);

// Atualizar a hora a cada segundo apenas para o primeiro card
function startClockForFirstCard() {
  setInterval(() => {
    updateFirstCard();
  }, 1000);
}

// Iniciar a atualização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  startClockForFirstCard();
});

// Supondo que você tenha o nível de acesso do usuário disponível na sessão
const user = JSON.parse(sessionStorage.getItem('user')); // Ou qualquer outra forma que você esteja utilizando

// Função para atualizar o menu de navegação com base no nível de acesso
function updateNavigation() {
  const financeLink = document.getElementById('financeLink');

  // Verifica se o usuário existe e obtém o nível de acesso
  if (user) {
    const accessLevel = user.access_level;

    // Se o nível de acesso for 'finance', mantém apenas o link do financeiro
    if (accessLevel === 'finance') {
      // Limpa todos os links, removendo completamente
      document.querySelector('#navLinks').innerHTML = '';
      const financeiroLink = document.createElement('li');
      financeiroLink.className = 'nav-item';
      financeiroLink.innerHTML = '<a class="nav-link active" href="/public/Financeiro.html">Financeiro</a>';
      document.querySelector('#navLinks').appendChild(financeiroLink);
    }
    // Se o nível de acesso não for 'finance', esconde o link de financeiro
    else if (accessLevel !== 'admin') { // Se o usuário não for admin, oculta o link financeiro
      financeLink.style.display = 'none'; // Torna invisível o link financeiro
    }
    // Se o nível de acesso for 'admin', mantém todos os links
  } else {
    // Se não houver usuário, pode esconder ou redirecionar
    document.querySelector('#navLinks').innerHTML = ''; // Pode limpar ou mostrar links de login, etc.
  }
}

// Chama a função para atualizar a navegação
updateNavigation();

let currentTable = 0;
const tables = document.querySelectorAll('.table-wrapper');

// Função para mostrar a tabela selecionada
function showTable(index) {
  tables.forEach((table, i) => {
    table.classList.toggle('d-none', i !== index);
  });
}

// Função para trocar entre as tabelas
function changeTable(direction) {
  if (direction === 'next') {
    currentTable = (currentTable + 1) % tables.length;
  } else if (direction === 'prev') {
    currentTable = (currentTable - 1 + tables.length) % tables.length;
  }
  showTable(currentTable);
}

// Função para carregar lotes no dropdown
async function loadLotes() {
  const response = await fetch('/api/lote');
  const lotes = await response.json();
  const loteSelect = document.getElementById('loteSelect');
  
  lotes.forEach(lote => {
    const option = document.createElement('option');
    option.value = lote.nome;
    option.textContent = lote.nome;
    loteSelect.appendChild(option);
  });

  // Seleciona um lote específico (lote 30, por exemplo)
  const loteId = 'lote 30'; // Lote específico desejado
  loteSelect.value = loteId; // Define o valor selecionado no dropdown
  loadTableData(); // Chama a função para carregar dados do lote selecionado
}


// Função para carregar dados da primeira tabela
async function loadTableData() {
  const loteId = document.getElementById('loteSelect').value;
  if (!loteId) return;

  console.log("Lote ID selecionado:", loteId);

  try {
    const response = await fetch(`/api/movimentacao-financeira?lote=${loteId}`);
    const data = await response.json();
    console.log("Dados recebidos para a tabela 1:", data);

    // Preencher a tabela com os dados recebidos
    const tbody = document.getElementById('tabela-representantes-geral');
    tbody.innerHTML = ''; // Limpa a tabela antes de adicionar novos dados

    if (Array.isArray(data) && data.length > 0) {
      data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.representante}</td>
          <td>${Number(item.total_kg).toFixed(2)}</td>
          <td>${Number(item.resultado_pd).toFixed(4)}</td>
          <td>${Number(item.resultado_pt).toFixed(4)}</td>
          <td>${Number(item.resultado_rh).toFixed(4)}</td>
          <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total)}</td>
          <td>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.media_kg)}</td>
        `;
        tbody.appendChild(row);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="7">Nenhum dado encontrado para este lote.</td></tr>';
    }

    // Atualiza o card com a informação do lote
    updateSecondCard(loteId);
    updateThirdCard(loteId);
    updateFourCard(loteId);
    updateFiveCard(loteId);

    
  } catch (error) {
    console.error('Erro ao carregar dados da tabela 1:', error);
  }
}


// Função para carregar dados da segunda tabela usando async/await
async function loadTable2Data(loteId) {
  if (!loteId) return;

  try {
    const response = await fetch(`/api/representantes_financeiros/geral?lote=${loteId}`);
    const data = await response.json();
    console.log("Dados recebidos para a tabela 2:", data);

    const tbody = document.getElementById('tabela-representantes');
    tbody.innerHTML = ''; // Limpa a tabela antes de adicionar novos dados

    if (data.length === 0) {
      console.warn('Nenhum dado encontrado para a tabela 2');
      return;
    }

    data.forEach(item => {
      const compraCatalisador = parseFloat(item.compra_catalisador) || 0;
      const saldoAdiantamentos = item.saldo_adiantamentos === '-' ? 0 : parseFloat(item.saldo_adiantamentos);
      const totalValorPecas = parseFloat(item.total_valor_pecas) || 0;
      const saldoTotal = compraCatalisador + totalValorPecas - saldoAdiantamentos;
      const saldoClass = saldoTotal >= 0 ? 'saldo-positivo' : 'saldo-negativo';

      const row = document.createElement('tr');
      row.className = 'draggable';
      row.setAttribute('data-representante', item.representante);
      row.innerHTML = `
              <td>${item.representante}</td>
              <td>${Number(item.total_kg).toFixed(2)}</td>
              <td class="compra-catalisador">${compraCatalisador.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td class="saldo-adiantamentos">${saldoAdiantamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td class="total-valor-pecas">${totalValorPecas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              <td class="${saldoClass}">${saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
          `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Erro ao carregar dados da tabela 2:', error);
  }
}

// Função para carregar dados da terceira tabela usando async/await
async function loadTable3Data() {
  const loteId = document.getElementById('loteSelect').value;
  if (!loteId) return;

  console.log("Carregando dados para o lote:", loteId);

  try {
    // Primeira requisição para a tabela de médias
    const response1 = await fetch(`/api/movimentacao-financeira-total?lote=${loteId}`);
    if (!response1.ok) throw new Error(`Erro na resposta da API: ${response1.status}`);
    const data = await response1.json();
    console.log("Dados recebidos para a tabela de médias:", data);

    const tbody1 = document.getElementById('medias-pd-pt-rh');
    tbody1.innerHTML = ''; // Limpa a tabela antes de adicionar novos dados

    if (Array.isArray(data) && data.length > 0) {
      data.forEach(item => {
        const row1 = document.createElement('tr');
        row1.innerHTML = `
              <td>PD</td>
                  <td>${parseFloat(item.total_resultado_pd).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              `;
        tbody1.appendChild(row1);

        const row2 = document.createElement('tr');
        row2.innerHTML = ` 
            <td>PT</td>
              <td>${parseFloat(item.total_resultado_pt).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              `;
        tbody1.appendChild(row2);

        const row3 = document.createElement('tr');
        row3.innerHTML = ` 
        <td>RH</td>
        <td>${parseFloat(item.total_resultado_rh).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
        `;
        tbody1.appendChild(row3);

      });
    } else {
      tbody1.innerHTML = '<tr><td colspan="3">Nenhum dado encontrado para médias.</td></tr>';
    }

    // Segunda requisição para a tabela de valores
    const response2 = await fetch(`/api/calcular-media/${loteId}`);
    if (!response2.ok) throw new Error(`Erro na resposta da API: ${response2.status}`);
    const data2 = await response2.json();
    console.log("Dados recebidos para a tabela de valores:", data2);

    const tbody2 = document.getElementById('valor-media-total');
    tbody2.innerHTML = ''; // Limpa a tabela antes de adicionar novos dados

    if (Array.isArray(data2) && data2.length > 0) {
      data2.forEach(item => {
        // Linha para Valor Total
        const row1 = document.createElement('tr');
        row1.innerHTML = `
                <td>Valor Total</td>
                <td>${parseFloat(item.soma_valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            `;
        tbody2.appendChild(row1);

        // Linha para Total Kg
        const row2 = document.createElement('tr');
        row2.innerHTML = `
                <td>Total Kg</td>
                <td>${parseFloat(item.soma_total_kg).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            `;
        tbody2.appendChild(row2);

        // Linha para Média Valor por Kg
        const row3 = document.createElement('tr');
        row3.innerHTML = `
                <td>Média Valor por Kg</td>
                <td>${parseFloat(item.media_valor_por_kg).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
            `;
        tbody2.appendChild(row3);
      });
    } else {
      tbody2.innerHTML = '<tr><td colspan="2">Nenhum dado encontrado para valores.</td></tr>';
    }

  } catch (error) {
    console.error('Erro ao carregar dados da tabela 3:', error);
    // Você pode adicionar uma mensagem amigável na UI aqui, se necessário
  }
}





$(document).ready(function () {
  // Inicializa carregando os lotes
  loadLotes().then(() => {
    const primeiroLote = $('#loteSelect').val();
    if (primeiroLote) {
      loadTableData(); // Carrega os dados da primeira tabela
      loadTable2Data(primeiroLote); // Carrega os dados da segunda tabela
      loadTable3Data(primeiroLote);
    }
  });

  // Evento para carregar dados das tabelas ao mudar a seleção do lote
  $('#loteSelect').change(function () {
    const lote = $(this).val();
    loadTableData(); // Carrega os dados da primeira tabela
    loadTable2Data(lote); // Carrega os dados da segunda tabela
    loadTable3Data(lote);
  });

  // Inicializa exibindo a primeira tabela
  showTable(currentTable);
});


