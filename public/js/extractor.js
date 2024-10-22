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

  // Cria a tabela e adiciona ao container de resultados
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
          <th scope="col">Tipo</th>
          <th scope="col">Hedge</th>
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
          <select id="lote${index}" class="form-control custom-spacing lote-input large-input" style="width: 10px;">
              <!-- Options will be populated dynamically -->
          </select>
      </td>
      <td><input type="text" id="Npdf${index}" class="form-control custom-spacing custom-n large-input" style="width: 30px;" value="${row.Npdf || ''}" readonly></td>
      <td><input type="text" class="form-control custom-spacing large-input" style="width: 50px;" value="${row.kg || ''}"></td>
      <td><input type="text" class="form-control custom-spacing large-input" style="width: 50px;" value="${row.pd || ''}"></td>
      <td><input type="text" class="form-control custom-spacing large-input" style="width: 50px;" value="${row.pt || ''}"></td>
      <td><input type="text" class="form-control custom-spacing large-input" style="width: 50px;" value="${row.rh || ''}"></td>
      <td><input type="text" class="form-control custom-spacing large-input" style="width: 50px;" value="${row.valorKg || ''}"></td>
      <td><input type="text" class="form-control custom-spacing large-input" style="width: 60px;" value="${row.valor || ''}"></td>
      <td><input type="text" class="form-control custom-spacing large-input tipo-input" style="width: 50px;" value="${row.tipo || ''}"></td>
      <td><input type="text" class="form-control custom-spacing large-input hedge-input" style="width: 50px;" value="${row.hedge || ''}"></td>
      <td>
          ${row.data === undefined ?
        `<input type="date" id="data${index}" class="form-control custom-spacing large-input" style="width: 50px;" placeholder="dd/mm/yyyy">` :
        `<input type="text" id="data${index}" class="form-control custom-spacing large-input" style="width: 80px;" value="${row.data}">`
      }
      </td>
      <td><input type="text" class="form-control custom-spacing large-input" style="width: 80px;" value="${row.hora || ''}"></td>
      <td>
          <select id="representante${index}" class="form-control custom-spacing representante-select sync-input large-input" style="width: 90px;">
              <!-- Options will be populated dynamically -->
          </select>
      </td>
      <td>
          <input list="fornecedores${index}" id="fornecedor${index}" class="form-control custom-spacing fornecedor-input sync-input large-input" style="width: 100px;" value="${row.fornecedor || ''}">
          <datalist id="fornecedores${index}" class="fornecedor-datalist large-input" style="width: 100px;">
              <!-- Options will be populated dinamicamente -->
          </datalist>
      </td>
      <td><input type="text" id="SN${index}" class="form-control custom-spacing large-input sn-input" style="width: 80px;" value="${row.sn || ''}"></td>
      <td><input type="hidden" id="SN${index}" class="form-control custom-spacing large-input sn-input" style="width: 80px;" value="${row.cpf || ''}"></td>
    `;

    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  // Adiciona a tabela diretamente ao container de resultados
  resultDiv.appendChild(table);

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
        select.addEventListener('change', function () {
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

  firstSnInput.addEventListener('input', function () {
    const newValue = this.value;
    snInputs.forEach(input => {
      input.value = newValue
    })
  })

  //Evento de entrada para sincronizar os campos "tipo"
  const tipoInputs = resultDiv.querySelectorAll('.tipo-input');
  tipoInputs.forEach((input, index) => {
    input.addEventListener('input', function () {
      const newValue = this.value;
      tipoInputs.forEach((syncInput, syncIndex) => {
        if (syncIndex !== index) {
          syncInput.value = newValue;
        }
      });
    });
  });

  //Evento de entrada para sincronizar os campos "Hedge"
  const hedgeInputs = resultDiv.querySelectorAll('.hedge-input');
  hedgeInputs.forEach((input, index) => {
    input.addEventListener('input', function () {
      const newValue = this.value;
      hedgeInputs.forEach((syncInput, syncIndex) => {
        if (syncIndex !== index) {
          syncInput.value = newValue;
        }
      });
    });
  });

  // Adicionar evento de entrada para sincronizar os campos "Lote"
  const loteInputs = resultDiv.querySelectorAll('.lote-input');
  const firstLoteInput = loteInputs[0]; // Primeiro campo "Lote"

  firstLoteInput.addEventListener('input', function () {
    const newValue = this.value;
    loteInputs.forEach(input => {
      input.value = newValue;
    });
  });


  // Adicionar eventos de entrada para sincronizar outros campos
  const syncInputs = resultDiv.querySelectorAll('.sync-input');
  syncInputs.forEach(input => {
    input.addEventListener('input', function () {
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

  } catch (error) { }
});

document.getElementById('sendButton').addEventListener('click', async () => {
  const table = document.querySelector('#result table');
  if (!table) {
      alert('No data to send');
      return;
  }

  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const uniqueData = new Map();
  let tipoValido = true;

  rows.forEach(row => {
      const cells = row.querySelectorAll('input, select');
      const tipo = cells[8].value;

      // Destacar o campo tipo se estiver vazio
      if (!tipo) {
          cells[8].style.borderColor = 'yellow';
          tipoValido = false;
      } else {
          cells[8].style.borderColor = ''; // Remove destaque se preenchido
      }

      const representante = cells[12].options[cells[12].selectedIndex].text;
      const lote = cells[0].value;
      const fornecedor = cells[13].value;

      if (!uniqueData.has(representante)) {
          uniqueData.set(representante, { lote, tipo, representante, fornecedor });
      }
  });

  if (!tipoValido) {
      alert('Por favor preencha o campo "TIPO"');
      return;
  }

  const detalhes = Array.from(uniqueData.values()).map(item => `
      <li><strong>Lote:</strong> ${item.lote}</li>
      <li><strong>Tipo:</strong> ${item.tipo}</li>
      <li><strong>Representante:</strong> ${item.representante}</li>
      <li><strong>Fornecedor:</strong> ${item.fornecedor}</li>
  `).join('');

  document.getElementById('detalhesConfirmacao').innerHTML = detalhes;

  // Exibir o modal de confirmação
  $('#confirmacaoModal').modal('show');

  document.getElementById('confirmarEnvio').onclick = async function () {
    let representanteSelecionado = document.getElementById("representante0").value;

    // Atualizar a contagem apenas se um representante estiver selecionado
    if (representanteSelecionado) {
        representanteAtual = representanteSelecionado;

        // Atualizar contagem para o representante atual
        contagemRepresentantes[representanteAtual] = (contagemRepresentantes[representanteAtual] || 0) + 1;

        // Atualizar todos os campos de input (SN e Npdf) com a contagem do representante atual
        let npdfInputs = document.querySelectorAll("[id^=Npdf]");
        for (let i = 0; i < npdfInputs.length; i++) {
            npdfInputs[i].value = contagemRepresentantes[representanteAtual];
        }
    } else {
        alert("Selecione um representante antes de confirmar.");
        return; // Interrompe o processo se nenhum representante estiver selecionado
    }
    // Seleciona o PDF para envio
    const pdfInput = document.getElementById('pdfInput');
    if (!pdfInput || !pdfInput.files.length) {
        alert('Por favor selecione um arquivo PDF');
        return;
    }

    const pdfFile = pdfInput.files[0];
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    formData.append('representanteId', representanteSelecionado);

    // Coletar os dados de lote e Npdf
    rows.forEach(row => {
        const cells = row.querySelectorAll('input, select');
        const lote = cells[0].value; // Supondo que o lote esteja na primeira célula
        const npdf = contagemRepresentantes[representanteAtual]; // Usar a contagem atualizada

        // Verificamos se o lote não está vazio antes de adicionar
        if (lote) {
            formData.append('lote', lote);
            formData.append('npdf', npdf);
        } else {
            console.warn('Lote está vazio em uma das linhas.');
        }
    });

    // Prepare and send the additional data
    const preparedData = prepareDataForSend(rows.map(row => {
        const cells = row.querySelectorAll('input, select');
        return {
            lote: cells[0].value,
            Npdf: contagemRepresentantes[representanteAtual], // Usando a contagem atualizada
            kg: cells[2].value,
            pd: cells[3].value,
            pt: cells[4].value,
            rh: cells[5].value,
            valorKg: cells[6].value,
            valor: cells[7].value,
            tipo: cells[8].value,
            hedge: cells[9].value,
            data: cells[10].value,
            hora: cells[11].value,
            representante: cells[12].options[cells[12].selectedIndex].text,
            fornecedor: cells[13].value,
            sn: cells[14].value,
            cpf: cells[15].value,
        };
    }));

    try {
        const response = await fetch('/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preparedData)
        });

        // Verificar o status da resposta
        if (response.ok) {
            alert('Data saved successfully');
        } else {
            const errorResponse = await response.json();
            console.error('Error Response:', errorResponse);
            alert('Erro ao Salvar: ' + (errorResponse.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Erro ao salvar os dados:', error);
        alert('Error: ' + error.message);
    }

    try {
        const response = await fetch('/save-pdf', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('PDF salvo com sucesso.');
        } else {
            alert('Falha ao salvar o PDF.');
        }
    } catch (error) {
        alert('Erro: ' + error.message);
    }

    // Atualizar a contagem no banco de dados
    try {
        const contagemAtualizada = contagemRepresentantes[representanteAtual];
        const updateResponse = await fetch('/atualizar-contagem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ representanteId: representanteSelecionado, contagem: contagemAtualizada })
        });

        if (updateResponse.ok) {
            alert('Contagem atualizada com sucesso.');
        } else {
            alert('Falha ao atualizar a contagem.');
        }
    } catch (error) {
        console.error('Erro ao atualizar a contagem:', error);
        alert('Erro: ' + error.message);
    }

    // Fechar o modal após enviar os dados
    $('#confirmacaoModal').modal('hide');
};

});

// Função para verificar se os dados são duplicados
async function checkForDuplicateData(rows) {
  const existingData = new Set(); // Mantenha um conjunto para dados existentes

  for (const row of rows) {
      const cells = row.querySelectorAll('input, select');
      const lote = cells[0].value;
      const npdf = contagemRepresentantes[representanteAtual]; // Usar a contagem atualizada

      if (!lote) continue; // Pular linhas sem lote

      // Criar uma chave única para o lote e Npdf
      const uniqueKey = `${lote}_${npdf}`;
      if (existingData.has(uniqueKey)) {
          return true; // Se já existe, retorna true
      }

      existingData.add(uniqueKey); // Adiciona ao conjunto
  }

  return false; // Retorna false se não encontrar duplicatas
}
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
async function carregarContagemRepresentantes() {
  try {
    const response = await fetch('/api/carregarContagem');
    if (!response.ok) {
      throw new Error('Erro ao carregar contagens: ' + response.statusText);
    }

    const contagemJSON = await response.json();
    return contagemJSON; // Retorna o objeto com as contagens dos representantes
  } catch (error) {
    console.error('Erro ao carregar contagem de representantes:', error);
    return {}; // Retorna um objeto vazio em caso de erro
  }
}

// Variáveis para armazenar o representante selecionado atualmente e a contagem de representantes
let representanteAtual = "";
let contagemRepresentantes =  carregarContagemRepresentantes(); 





// Função chamada ao clicar no botão de enviar
function enviarDados() {
  // Obter o valor selecionado do select
  let representanteSelecionado = document.getElementById("representante0").value;

  // Verificar se um representante está selecionado
  if (representanteSelecionado) {
    // Atualizar a contagem apenas se um representante estiver selecionado
    representanteAtual = representanteSelecionado;

    // Inicializar a contagem para o novo representante ou continuar a partir do último número salvo
    if (contagemRepresentantes.hasOwnProperty(representanteAtual)) {
      // Incrementar o contador para o representante atual
      contagemRepresentantes[representanteAtual]++;
    } else {
      // Inicializar contagem para o novo representante
      contagemRepresentantes[representanteAtual] = 1;
    }

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
window.onload = async function () {
  contagemRepresentantes = await carregarContagemRepresentantes();
  // Aqui você pode adicionar qualquer lógica adicional para atualizar a interface
  console.log('Contagem de representantes carregada:', contagemRepresentantes);
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
    } else if (input.classList.contains('lote-input')) {
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
async function salvarEdicoes() {
  let modalContent = document.getElementById("editModalContent");
  let contagemParaSalvar = {};

  // Atualiza a contagem de representantes com base nos valores dos inputs no modal
  for (let representanteID in contagemRepresentantes) {
    if (contagemRepresentantes.hasOwnProperty(representanteID)) {
      let input = modalContent.querySelector(`#rep_${representanteID}`);
      if (input) {
        const novaContagem = parseInt(input.value) || 0;
        contagemRepresentantes[representanteID] = novaContagem;
        contagemParaSalvar[representanteID] = novaContagem; // Salvar a nova contagem para enviar
      }
    }
  }

  try {
    // Enviar as contagens para o servidor
    const response = await fetch('/api/salvarContagem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ contagemRepresentantes: contagemParaSalvar })
    });

    if (!response.ok) {
      throw new Error('Erro ao salvar contagens: ' + response.statusText);
    }

    alert('Contagens salvas com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar as edições:', error);
    alert('Erro ao salvar as edições: ' + error.message);
  }

  $('#editModal').modal('hide'); // Usando jQuery para fechar o modal
}


// Função para mostrar o modal de confirmação de reset
function mostrarConfirmacaoReset() {
  $('#confirmResetModal').modal('show');
}

// Função para confirmar o reset
document.getElementById('confirmResetButton').addEventListener('click', function () {
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

const inputStyle = `
  .large-input {
    font-size: 0.8rem;  /* Aumenta o tamanho da fonte */
    padding: 5px;     /* Aumenta o espaçamento interno */
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = inputStyle;
document.head.appendChild(styleSheet);


