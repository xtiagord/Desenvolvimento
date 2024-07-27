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

  const table = document.createElement('table');
  table.className = 'table table-striped';

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
        <td><input type="text" id="lote${index}" class="form-control form-control-lg custom-width lote-input" value="${row.lote}"></td>
        <td><input type="text" id="Npdf${index}" class="form-control form-control-lg custom-width-n" value="${row.Npdf}" readonly></td>
        <td><input type="text" class="form-control form-control-lg custom-width" value="${row.kg}"></td>
        <td><input type="text" class="form-control form-control-lg custom-width" value="${row.pd}"></td>
        <td><input type="text" class="form-control form-control-lg custom-width" value="${row.pt}"></td>
        <td><input type="text" class="form-control form-control-lg custom-width" value="${row.rh}"></td>
        <td><input type="text" class="form-control form-control-lg custom-width" value="${row.valorKg}"></td>
        <td><input type="text" class="form-control form-control-lg custom-width" value="${row.valor}"></td>
        <td><input type="text" class="form-control form-control-lg custom-width" value="${row.data}"></td>
        <td><input type="text" class="form-control form-control-lg custom-width" value="${row.hora}"></td>
        <td>
            <select id="representante${index}" class="form-control form-control-lg custom-width representante-select sync-input">
                <!-- Options will be populated dynamically -->
            </select>
        </td>
        <td>
            <input list="fornecedores${index}" id="fornecedor${index}" class="form-control form-control-lg custom-width fornecedor-input sync-input" value="${row.fornecedor}">
            <datalist id="fornecedores${index}" class="fornecedor-datalist">
                <!-- Options will be populated dinamicamente -->
            </datalist>
        </td>
        <td><input type="text" id="SN${index}" class="form-control form-control-lg custom-width sn-input" value="${row.sn}"></td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  resultDiv.appendChild(table);

  // Preencher os selects de representante com os valores atuais
  const representanteSelects = resultDiv.querySelectorAll('.representante-select');
  representanteSelects.forEach((select, index) => {
    select.value = data[index].representante;
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

  try {
    // Chamada única para /save
    const response = await fetch('/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
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

// Função para inicializar ou carregar contagem de representantes do localStorage
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
