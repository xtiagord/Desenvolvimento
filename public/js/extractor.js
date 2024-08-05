document.addEventListener('DOMContentLoaded', async () => {
  try {
    const [representantes, fornecedores, equipamentos] = await Promise.all([fetchRepresentantes(), fetchFornecedores(), fetchEquipamentos()]);
    populateDropdown('representanteSelect', representantes);
  } catch (error) {
    console.error('Erro ao carregar representantes, fornecedores ou equipamentos:', error);
  }
});

function populateDropdown(selectId, items) {
  const select = document.getElementById(selectId);
  if (!select) {
    console.error(`Elemento select com id "${selectId}" não encontrado.`);
    return;
  }
  // Limpa o dropdown antes de populá-lo
  select.innerHTML = '';

  items.forEach(item => {
    const option = document.createElement('option');
    option.value = item.id;
    option.textContent = item.nome;
    select.appendChild(option);
  });
}

function displayData(data) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '';

  // Cria o elemento card
  const card = document.createElement('div');
  card.className = 'card mb-4 custom-card'; // Adiciona a classe de card do Bootstrap e uma margem inferior

  // Cria o cabeçalho do card
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';
  cardHeader.innerHTML = '<h5 class="mb-0">Dados Extraídos</h5>'; // Cabeçalho do card
  card.appendChild(cardHeader);

  // Cria o corpo do card
  const cardBody = document.createElement('div');
  cardBody.className = 'card-body p-0';

  // Cria a tabela e adiciona ao corpo do card
  const table = document.createElement('table');
  table.className = 'table table-striped w-100'; // Adiciona a classe w-100 para ocupar a largura total
  const thead = document.createElement('thead');
  thead.innerHTML = `
      <tr>
          <th scope="col">Lote</th>
          <th scope="col">Nº PDF</th>
          <th scope="col">Kg</th>
          <th scope="col">PD</th>
          <th scope="col">PT</th>
          <th scope="col">RH</th>
          <th scope="col">Valor KG</th>
          <th scope="col">Valor</th>
          <th scope="col">Data</th>
          <th scope="col">Hora</th>
          <th scope="col">Representante</th>
          <th scope="col">Fornecedor</th>
          <th scope="col">SN</th>
      </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
         <td>
            <select id="lote${index}" class="form-control custom-spacing custom-width lote-input">
                <!-- Options will be populated dynamically -->
            </select>
        </td>
        <td><input type="text" id="Npdf${index}" class="form-control custom-spacing custom-width custom-n" value="${row.Npdf || ''}" readonly></td>
        <td><input type="text" class="form-control custom-spacing custom-width" value="${row.kg || ''}"></td>
        <td><input type="text" class="form-control custom-spacing custom-width" value="${row.pd || ''}"></td>
        <td><input type="text" class="form-control custom-spacing custom-width" value="${row.pt || ''}"></td>
        <td><input type="text" class="form-control custom-spacing custom-width" value="${row.rh || ''}"></td>
        <td><input type="text" class="form-control custom-spacing custom-width" value="${row.valorKg || ''}"></td>
        <td><input type="text" class="form-control custom-spacing custom-width" value="${row.valor || ''}"></td>
        <td>
            ${row.data === undefined ? 
                `<input type="date" id="data${index}" class="form-control custom-spacing custom-width" placeholder="dd/mm/yyyy">` :
                `<input type="text" id="data${index}" class="form-control custom-spacing custom-width" value="${row.data}">`
            }
        </td>
        <td><input type="text" class="form-control custom-spacing custom-width" value="${row.hora || ''}"></td>
        <td>
            <select id="representante${index}" class="form-control custom-spacing custom-width representante-select sync-input">
                <!-- Options will be populated dynamically -->
            </select>
        </td>
        <td>
            <input list="fornecedores${index}" id="fornecedor${index}" class="form-control custom-spacing custom-width fornecedor-input sync-input" value="${row.fornecedor || ''}">
            <datalist id="fornecedores${index}" class="fornecedor-datalist">
                <!-- Options will be populated dinamicamente -->
            </datalist>
        </td>
        <td><input type="text" id="SN${index}" class="form-control custom-spacing custom-width sn-input" value="${row.sn || ''}"></td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Adiciona a tabela ao corpo do card
  cardBody.appendChild(table);
  card.appendChild(cardBody);

  // Adiciona o card ao container de resultados
  resultDiv.appendChild(card);

  // Preencher os selects de representante com os valores atuais
  const representanteSelects = resultDiv.querySelectorAll('.representante-select');
  representanteSelects.forEach((select, index) => {
    select.value = data[index].representante || '';
  });

  // Preencher os datalists de fornecedor com os valores atuais
  const fornecedorInputs = resultDiv.querySelectorAll('.fornecedor-input');
  const fornecedores = document.getElementById('fornecedorSelect').options;
  fornecedorInputs.forEach((input, index) => {
    const datalist = document.getElementById(`fornecedores${index}`);
    Array.from(fornecedores).forEach(option => {
      const newOption = option.cloneNode(true);
      datalist.appendChild(newOption);
    });
    input.value = data[index].fornecedor; 
  });

// Preencher os selects de lote
fetch('/api/lote')
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao buscar lotes');
        }
        return response.json();
    })
    .then(lotes => {
        // Adiciona select para cada linha
        data.forEach((_, index) => {
            const select = document.createElement('select');
            select.id = `lotesSelect${index}`;
            select.className = 'form-control custom-spacing custom-width lote-input';

            lotes.forEach(lote => {
                const option = document.createElement('option');
                option.value = lote.nome; // Certifique-se de acessar a propriedade 'nome'
                option.textContent = lote.nome; // Use a propriedade 'nome' para o texto da opção
                select.appendChild(option);
            });

            // Substituir o input text por um select
            const loteInput = document.getElementById(`lote${index}`);
            loteInput.parentNode.replaceChild(select, loteInput);

            // Adicionar evento change para sincronizar a seleção
            select.addEventListener('change', function() {
                const newValue = this.value;
                const loteInputs = document.querySelectorAll('.lote-input');
                loteInputs.forEach(input => {
                    input.value = newValue;
                });
            });
        });
    })
    .catch(error => {
        console.error('Erro ao buscar lotes:', error);
    });


  // Adicionar evento para sincronizar data entre os campos
  const dateInputs = resultDiv.querySelectorAll('input[type="date"]');
  dateInputs.forEach(dateInput => {
    dateInput.addEventListener('change', (event) => {
      const selectedDate = event.target.value;
      dateInputs.forEach(input => {
        if (input !== event.target) {
          input.value = selectedDate;
        }
      });
    });
  });


  // Atualizar os dropdowns principais com os dados atuais
  populateDropdownsInTable('representante-select', 'representanteSelect');

  //Evento de entrada para sincronizar os campos "SN"
  const snInputs = resultDiv.querySelectorAll('.sn-input');
  const firstSnInput = snInputs[0];

  firstSnInput.addEventListener('input', function(){
    const newValue = this.value;
    snInputs.forEach(input => {
      input.value = newValue
    })
  })

 // Adicionar evento de entrada para sincronizar os campos "Lote"
 const loteInputs = resultDiv.querySelectorAll('.lote-input');
 const firstLoteInput = loteInputs[0]; // Primeiro campo "Lote"
 
 firstLoteInput.addEventListener('input', function() {
   const newValue = this.value;
   loteInputs.forEach(input => {
     input.value = newValue;
   });
 });
  

// Adicionar eventos de entrada para sincronizar outros campos
const syncInputs = resultDiv.querySelectorAll('.sync-input');
syncInputs.forEach(input => {
  input.addEventListener('input', function() {
    const newValue = this.value;
    if (this.classList.contains('fornecedor-input')) {
      // Se for um campo de fornecedor, replicar em todos os campos de fornecedor
      const fornecedorInputs = resultDiv.querySelectorAll('.fornecedor-input');
      fornecedorInputs.forEach(fornecedorInput => {
        fornecedorInput.value = newValue;
      });
    } else if (this.classList.contains('representante-select')) {
      // Se for um campo de representante, replicar em todos os campos de representante
      const representanteSelects = resultDiv.querySelectorAll('.representante-select');
      representanteSelects.forEach(representanteSelect => {
        representanteSelect.value = newValue;
      });
    }
  });
});

document.getElementById('resetButton').style.display = 'block';
document.getElementById('editButton').style.display = 'block';


  // Exibir o botão de adicionar linha após a extração
  document.getElementById('addRowButton').style.display = 'block';
}

// Carregar e preencher os datalists principais com os dados atuais
function populateDropdownsInTable(className, selectId) {
  const options = document.getElementById(selectId).options;
  const datalists = document.querySelectorAll(`.${className}`);
  datalists.forEach(datalist => {
    Array.from(options).forEach(option => {
      const newOption = option.cloneNode(true);
      datalist.appendChild(newOption);
    });
  });
}




async function fetchCooperadosByRepresentante(representanteId) {
  try {
    const response = await fetch(`/api/cooperados/${representanteId}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar cooperados');
    }
    const cooperados = await response.json();
    return cooperados;
  } catch (error) {
    console.error('Erro ao buscar cooperados:', error);
    return [];
  }
}

document.getElementById('extractButton').addEventListener('click', async () => {
  const pdfInput = document.getElementById('pdfInput');
  if (pdfInput.files.length === 0) {
    alert('Please select a PDF file first');
    return;
  }

  const file = pdfInput.files[0];
  const formData = new FormData();
  formData.append('pdf', file);

  try {
    const response = await fetch('/extract', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      displayData(result);
      document.getElementById('sendButton').style.display = 'block'; // Mostra o botão enviar
    } else {
      document.getElementById('result').textContent = 'Failed to extract data';
    }
  } catch (error) {
    document.getElementById('result').textContent = 'Error: ' + error.message;
  }

  try {
    const extractedText = await extractTextFromPDF(file);
    const data = extractDataFromText(extractedText);
    document.getElementById('sendButton').style.display = 'block';

  } catch (error) {}
});

document.getElementById('sendButton').addEventListener('click', async () => {
  const table = document.querySelector('#result table');
  if (!table) {
    alert('No data to send');
    return;
  }

  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const data = rows.map(row => {
    const cells = row.querySelectorAll('input, select');
    return {
      lote: cells[0].value, // Novo campo de lote
      Npdf: cells[1].value,
      kg: cells[2].value,
      pd: cells[3].value,
      pt: cells[4].value,
      rh: cells[5].value,
      valorKg: cells[6].value,
      valor: cells[7].value,
      data: cells[8].value,
      hora: cells[9].value,
      representante: cells[10].options[cells[10].selectedIndex].text, // Pegando o nome do representante
      fornecedor: cells[11].value, // Pegando o fornecedor selecionado
      sn: cells[12].value
    };
  });
  const preparedData = prepareDataForSend(data);

  try {
    // Chamada única para /save
    const response = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preparedData)
    });

    if (response.ok) {
      alert('Data saved successfully');
    } else {
      alert('Failed to save data');
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

function formatDecimal(value) {
  if (value === null || value === undefined || value === '') return '';
  return value.toString().replace(',', '.');
}

function prepareDataForSend(data) {
  return data.map(item => {
    const formattedItem = {
      ...item,
      kg: formatDecimal(item.kg),
      pd: formatDecimal(item.pd),
      pt: formatDecimal(item.pt),
      rh: formatDecimal(item.rh),
      valorKg: formatDecimal(item.valorKg),
      valor: formatDecimal(item.valor)
    };

    // Adicione logs para verificar os valores formatados
    console.log('Formatted item:', formattedItem);
    return formattedItem;
  });
}


async function fetchCooperadosByRepresentante(representanteId) {
try {
  const response = await fetch(`/api/cooperados/${representanteId}`);
  if (!response.ok) {
    throw new Error('Erro ao buscar cooperados');
  }
  const cooperados = await response.json();
  return cooperados;
} catch (error) {
  console.error('Erro ao buscar cooperados:', error);
  return [];
}
}
function carregarContagemRepresentantes() {
  let contagemJSON = localStorage.getItem('contagemRepresentantes');
  if (contagemJSON) {
    return JSON.parse(contagemJSON);
  } else {
    return {};
  }
}

// Variáveis para armazenar o representante selecionado atualmente e a contagem de representantes
let representanteAtual = "";
let contagemRepresentantes = carregarContagemRepresentantes();

// Função para salvar a contagem atual no localStorage
function salvarContagemRepresentantes() {
  localStorage.setItem('contagemRepresentantes', JSON.stringify(contagemRepresentantes));
}

// Função chamada ao clicar no botão de enviar
function enviarDados() {
  // Obter o valor selecionado do select
  let representanteSelecionado = document.getElementById("representante0").value;

  // Atualizar a contagem apenas se um representante estiver selecionado
  if (representanteSelecionado) {
    // Atualizar o representante atual
    representanteAtual = representanteSelecionado;

    // Inicializar a contagem para o novo representante ou continuar a partir do último número salvo
    if (contagemRepresentantes.hasOwnProperty(representanteAtual)) {
      // Incrementar o contador para o representante atual
      contagemRepresentantes[representanteAtual]++;
    } else {
      // Inicializar contagem para o novo representante
      contagemRepresentantes[representanteAtual] = 1;
    }

    // Salvar a contagem atualizada no localStorage
    salvarContagemRepresentantes();

    // Atualizar todos os campos de input (SN e Npdf) com a contagem do representante atual
    let npdfInputs = document.querySelectorAll("[id^=Npdf]");
    for (let i = 0; i < npdfInputs.length; i++) {
      npdfInputs[i].value = contagemRepresentantes[representanteAtual];
    }
  } else {
    alert("Selecione um representante antes de enviar.");
  }
}

// Função para mostrar o botão de enviar
function mostrarEnviar() {
  document.getElementById('sendButton').style.display = 'block';
}

// Carregar contagem inicial ao carregar a página
window.onload = function() {
  contagemRepresentantes = carregarContagemRepresentantes();
};

// Função para adicionar uma nova linha à tabela
function addNewRow() {
  const table = document.querySelector('#result table tbody');
  if (!table) {
    console.error('Tabela não encontrada.');
    return;
  }

  // Clone a primeira linha da tabela para criar uma nova
  const firstRow = table.querySelector('tr');
  if (!firstRow) {
    console.error('Linha para clonar não encontrada.');
    return;
  }

  // Clona a linha e reseta os valores dos inputs
  const newRow = firstRow.cloneNode(true);
  const inputs = newRow.querySelectorAll('input, select');
  
  inputs.forEach(input => {
    // Herda os valores das colunas SN, Hora, e Data
    if (input.classList.contains('sn-input')) {
      input.value = firstRow.querySelector('.sn-input').value;
    } else if (input.classList.contains('form-control-lg') && input.id.includes('hora')) {
      input.value = firstRow.querySelector('[id*="hora"]').value;
    } else if (input.classList.contains('form-control-lg') && input.id.includes('data')) {
      input.value = firstRow.querySelector('[id*="data"]').value;
    } else if (input.classList.contains('lote-input')){
      input.value = firstRow.querySelector('.lote-input').value;
    } else {
      input.value = ''; // Reseta os valores de outras colunas
    }

    input.id = `${input.id}_${table.children.length}`; // Atualiza o ID para garantir que seja único
  });
  
  table.appendChild(newRow);
}

// Adiciona o evento de clique ao botão de adicionar linha
document.getElementById('addRowButton').addEventListener('click', addNewRow);

// Função para abrir o modal de edição
async function abrirModalEdicao() {
  let modalContent = document.getElementById("editModalContent");
  
  // Limpa o conteúdo do modal antes de adicionar novos itens
  modalContent.innerHTML = "";

  try {
    const response = await fetch('/api/representantes');
    const representantes = await response.json();
    const idsProcessados = new Set(); // Para rastrear IDs já processados
    
    console.log("Representantes:", representantes); // Verificação no console

    for (let representanteID in contagemRepresentantes) {
      if (contagemRepresentantes.hasOwnProperty(representanteID)) {
        // Verifica se o representante já foi processado
        if (idsProcessados.has(representanteID)) continue;

        // Busca o nome do representante com base no ID
        const representante = representantes.find(rep => rep.id === parseInt(representanteID));
        if (!representante) continue;
        
        const representanteNome = representante.nome;
        const campoID = `rep_${representanteID}`;
        modalContent.innerHTML += `
          <div class="form-group">
            <label for="${campoID}">${representanteNome}</label>
            <input type="number" class="form-control" id="${campoID}" value="${contagemRepresentantes[representanteID]}">
          </div>
        `;

        // Marca o ID como processado
        idsProcessados.add(representanteID);
      }
    }

    $('#editModal').modal('show'); // Usando jQuery para abrir o modal
  } catch (error) {
    console.error('Erro ao buscar representantes:', error);
  }
}

// Função para salvar as edições do modal
function salvarEdicoes() {
  let modalContent = document.getElementById("editModalContent");

  // Atualiza a contagem de representantes com base nos valores dos inputs no modal
  for (let representanteID in contagemRepresentantes) {
    if (contagemRepresentantes.hasOwnProperty(representanteID)) {
      let input = modalContent.querySelector(`#rep_${representanteID}`);
      if (input) {
        contagemRepresentantes[representanteID] = parseInt(input.value) || 0;
      }
    }
  }

  salvarContagemRepresentantes();
  $('#editModal').modal('hide'); // Usando jQuery para fechar o modal
}

// Função para mostrar o modal de confirmação de reset
function mostrarConfirmacaoReset() {
  $('#confirmResetModal').modal('show');
}

// Função para confirmar o reset
document.getElementById('confirmResetButton').addEventListener('click', function() {
  // Fechar o modal de confirmação
  $('#confirmResetModal').modal('hide');

  // Resetar a contagem
  resetarContagem();

  // Exibir o modal de sucesso
  $('#successResetModal').modal('show');
});

// Função para resetar a contagem
function resetarContagem() {
  // Resetar a contagem de todos os representantes para 0
  contagemRepresentantes = {};

  // Salvar a contagem atualizada no localStorage
  salvarContagemRepresentantes();

  // Atualizar todos os campos de input (SN e Npdf) para 0
  let snInputs = document.querySelectorAll("[id^=SN]");
  let npdfInputs = document.querySelectorAll("[id^=Npdf]");
  for (let i = 0; i < snInputs.length; i++) {
    snInputs[i].value = 0;
  }
  for (let i = 0; i < npdfInputs.length; i++) {
    npdfInputs[i].value = 0;
  }
}

// Adiciona o evento de clique aos botões
document.getElementById('resetButton').addEventListener('click', mostrarConfirmacaoReset);
document.getElementById('editButton').addEventListener('click', abrirModalEdicao);

