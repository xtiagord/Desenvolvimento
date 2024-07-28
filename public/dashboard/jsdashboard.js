document.addEventListener('DOMContentLoaded', function() {
    // Função para formatar valores como moeda brasileira
    function formatCurrency(value) {
      return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    // Função para ajustar os valores para exibição
    function adjustValues(value) {
      return parseFloat(value).toFixed(2); // Garante que o valor é um número decimal com duas casas decimais
    }

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

    // Buscar dados da média de PD
    fetch('/api/media-pd')
      .then(response => response.json())
      .then(data => {
        console.log('Dados recebidos da média de PD:', data);

        const representantes = data.map(item => item.representante);
        const mediaPd = data.map(item => adjustValues(item.mediaPd)); // Ajusta os valores

        console.log('Representantes:', representantes);
        console.log('Média PD:', mediaPd);

        const ctxMediaPd = document.getElementById('representantesChartMediaPd').getContext('2d');
        new Chart(ctxMediaPd, {
          type: 'bar',
          data: {
            labels: representantes,
            datasets: [{
              label: 'Média PD por Representante',
              data: mediaPd,
              backgroundColor: 'rgba(255, 206, 86, 0.2)',
              borderColor: 'rgba(255, 206, 86, 1)',
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
        console.error('Erro ao carregar dados da média de PD:', error);
      });
  });

  // Função para ajustar o tamanho do gráfico
  function resizeChart(chartId, action) {
    const chartBox = document.querySelector(`#${chartId}`).parentElement;
    if (action === 'increase') {
      chartBox.style.width = 'calc(100% - 20px)'; // Aumenta o tamanho do gráfico
    } else if (action === 'decrease') {
      chartBox.style.width = 'calc(50% - 20px)'; // Diminui o tamanho do gráfico
    }
  }