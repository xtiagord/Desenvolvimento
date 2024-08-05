document.addEventListener('DOMContentLoaded', function() {
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
                formatter: function(value, context) {
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
                  callback: function(value) {
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
document.addEventListener('DOMContentLoaded', function() {
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

// Atualizar a hora a cada segundo apenas para o primeiro card
function startClockForFirstCard() {
  setInterval(() => {
    updateFirstCard();
  }, 1000); // Atualiza a cada 1 segundo
}

// Iniciar a atualização ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
  startClockForFirstCard();
});
