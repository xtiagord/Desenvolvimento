//Carrega os representantes no modal
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/representantes')
        .then(response => response.json())
        .then(representantes => {
            const representanteSelect = document.getElementById('representante_select');

            // Limpa o select antes de adicionar novas opções
            representanteSelect.innerHTML = '';

            // Adiciona as opções ao select
            representantes.forEach(representante => {
                const option = document.createElement('option');
                option.value = representante.id;
                option.textContent = representante.nome;
                representanteSelect.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar os representantes:', error));
});

document.getElementById('formCadastroComprador').addEventListener('submit', function (event) {
    event.preventDefault();

    console.log('Formulário enviado');

    const representante_id = document.getElementById('representante_select').value;
    const nome = document.getElementById('comprador_nome').value;
    const cpf_cnpj = document.getElementById('cpf_cnpj_mod').value;
    const rg = document.getElementById('rg_mod').value;
    const apelido = document.getElementById('comprador_apelido').value;

    // Logando valores capturados
    console.log('Representante ID:', representante_id);
    console.log('Nome:', nome);
    console.log('CPF/CNPJ:', cpf_cnpj);
    console.log('RG:', rg);
    console.log('Apelido:', apelido);

    // Adicione esta linha para verificar espaços em branco
    console.log('Espaços em branco no CPF/CNPJ:', cpf_cnpj.trim().length);
    console.log('Espaços em branco no RG:', rg.trim().length);

    if (!cpf_cnpj.trim() || !rg.trim()) {
        alert('Por favor, preencha os campos CPF/CNPJ e RG.');
        return; // Não envia o formulário se os campos estiverem vazios
    }

    const data = {
        representante_id,
        nome,
        cpf_cnpj,
        rg,
        apelido
    };

    fetch('/api/comprador-representante', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                closeModal(); // Fechar o modal após salvar
            } else {
                alert('Erro ao salvar o comprador');
            }
        })
        .catch((error) => {
            console.error('Erro:', error);
        });
});

// Função para formatar CPF/CNPJ
function formatarCpfCnpj(cpfCnpj) {
    cpfCnpj = cpfCnpj.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (cpfCnpj.length <= 11) {
        // Formato de CPF: 123.456.789-01
        return cpfCnpj.replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
        // Formato de CNPJ: 12.345.678/9012-34
        return cpfCnpj.replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,4})$/, '$1/$2')
            .replace(/(\d{4})(\d{2})$/, '$1-$2');
    }
}

// Função para formatar RG
function formatarRg(rg) {
    rg = rg.replace(/\D/g, ''); // Remove tudo que não é dígito
    return rg.replace(/(\d{1,2})(\d{3})(\d{3})/, '$1.$2.$3-');
}

// Evento de input para CPF/CNPJ
document.getElementById('cpf_cnpj_mod').addEventListener('input', function () {
    this.value = formatarCpfCnpj(this.value);
});

// Evento de input para RG
document.getElementById('rg_mod').addEventListener('input', function () {
    this.value = formatarRg(this.value);
});

document.addEventListener('DOMContentLoaded', () => {
    // Função para carregar representantes
    function carregarRepresentantes() {
        fetch('/api/representantes')
            .then(response => response.json())
            .then(data => {
                const representanteSelect = document.getElementById('representante');
                representanteSelect.innerHTML = '<option value="">Selecione um representante</option>';

                data.forEach(representante => {
                    const option = document.createElement('option');
                    option.value = representante.id; // Ajuste para o ID correto
                    option.textContent = representante.nome; // Ajuste para o nome correto
                    representanteSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Erro ao carregar representantes:', error));
    }

    // Função para carregar compradores associados ao representante
    function carregarCompradores(representanteId) {
        const compradorSelect = document.getElementById('comprador');
        compradorSelect.innerHTML = '<option value="">Selecione um comprador</option>'; // Limpar opções anteriores

        if (representanteId) {
            fetch(`/api/representantes_compradores/${representanteId}`)
                .then(response => response.json())
                .then(data => {
                    console.log(data); // Adicione log para verificar os dados recebidos

                    if (Array.isArray(data)) {
                        data.forEach(comprador => {
                            const option = document.createElement('option');
                            option.value = comprador.id; // Use o ID do comprador aqui
                            option.textContent = comprador.nome_comprador; // Ajuste se necessário
                            compradorSelect.appendChild(option);
                        });
                    } else {
                        console.error('Formato inesperado dos dados:', data);
                    }
                })
                .catch(error => console.error('Erro ao carregar compradores:', error));
        }
    } 
   // Função para carregar máquinas associadas ao representante
function carregarMaquinas(representanteId) {
    const maquinaSelect = document.getElementById('maquina');
    maquinaSelect.innerHTML = '<option value="">Selecione uma máquina</option>'; // Limpar opções anteriores

    if (representanteId) {
        fetch(`/api/maquinas_representante/${representanteId}`)
            .then(response => response.json())
            .then(data => {
                // Adicione log para verificar os dados recebidos
                console.log(data);

                // Verifique se `data` é um array
                if (Array.isArray(data)) {
                    data.forEach(maquina => {
                        const option = document.createElement('option');
                        option.value = maquina.id_maquina; // Usando o ID da máquina
                        option.textContent = maquina.nome_maquina; // Usando o nome da máquina
                        maquinaSelect.appendChild(option);
                    });
                } else {
                    console.error('Formato inesperado dos dados:', data);
                }
            })
            .catch(error => console.error('Erro ao carregar máquinas:', error));
    }
}

    // Função para carregar informações do comprador
    function carregarInformacoesComprador(compradorId) {
        if (compradorId) {
            fetch(`/api/comprador/${compradorId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro na requisição: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    // Preencher os campos com os dados retornados
                    document.getElementById('apelido').value = data.apelido;
                    document.getElementById('cpf_cnpj').value = data.cpf_cnpj;
                    document.getElementById('rg').value = data.rg;
                })
                .catch(error => console.error('Erro ao carregar informações do comprador:', error));
        }
    }
    
    // Adicionar evento para carregar informações do comprador ao selecionar um comprador
    document.getElementById('comprador').addEventListener('change', (event) => {
        const compradorId = event.target.value;
        carregarInformacoesComprador(compradorId);
    });

    // Adicionar evento para carregar máquinas ao selecionar um representante
    document.getElementById('representante').addEventListener('change', (event) => {
        const representanteId = event.target.value;
        carregarCompradores(representanteId);
        carregarMaquinas(representanteId); // Chama a função para carregar máquinas
    });

    // Carregar representantes ao iniciar
    carregarRepresentantes();
});

//CADASTRAR TIPO
document.addEventListener('DOMContentLoaded', () => {
    // Adicionar evento para o botão de salvar
    document.getElementById('salvarTipo').addEventListener('click', () => {
        // Capturar os dados do formulário
        const numeroTipo = document.getElementById('numeroTipo').value;
        const valorPd = document.getElementById('valorPd').value;
        const valorPt = document.getElementById('valorPt').value;
        const valorRh = document.getElementById('valorRh').value;
        const tipoMoeda = document.getElementById('tipoMoeda').value; // Captura o valor da moeda
        const valorMoeda = document.getElementById('valorMoeda').value; // Captura o valor monetário

        // Verificar se todos os campos estão preenchidos
        if (numeroTipo && valorPd && valorPt && valorRh && tipoMoeda && valorMoeda) {
            // Aqui você pode fazer a requisição para salvar os dados, por exemplo:
            fetch('/api/tipos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    numeroTipo,
                    valorPd,
                    valorPt,
                    valorRh,
                    tipoMoeda, // Envia o tipo da moeda
                    valorMoeda
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Tipo cadastrado:', data);
                // Fechar o modal
                $('#cadastrarTipoModal').modal('hide');
                // Limpar o formulário
                document.getElementById('tipoForm').reset();
                // Aqui você pode atualizar a lista de tipos, se necessário
            })
            .catch(error => console.error('Erro ao cadastrar tipo:', error));
        } else {
            alert('Por favor, preencha todos os campos.');
        }
    });
});

// Código para preencher o dropdown com tipos
document.addEventListener('DOMContentLoaded', () => {
    // Função para buscar tipos e preencher o select
    function carregarTipos() {
        fetch('/api/tipos')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao buscar tipos');
                }
                return response.json();
            })
            .then(data => {
                const tipoSelect = document.getElementById('tipo');
                // Limpa o select antes de preencher
                tipoSelect.innerHTML = '';

                // Cria uma opção padrão
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'Selecione um tipo';
                tipoSelect.appendChild(option);

                // Preencher o select com tipos
                data.forEach(tipo => {
                    const option = document.createElement('option');
                    option.value = tipo.numero_tipo; // ou outro identificador, se necessário
                    option.textContent = tipo.numero_tipo; // Mostra o valor no dropdown
                    tipoSelect.appendChild(option);
                });
            })
            .catch(error => console.error('Erro ao carregar tipos:', error));
    }

    // Chama a função ao carregar a página
    carregarTipos();
});

document.addEventListener('DOMContentLoaded', () => {
    let linhaCount = 1; // Contador de linhas

    // Função para converter vírgula em ponto
    function convertDecimal(value) {
        return value.replace(',', '.');
    }

    // Evento para o botão de adicionar linha
    document.getElementById('addRow').addEventListener('click', () => {
        if (linhaCount < 15) { // Limita a 15 linhas
            adicionarLinha();
        } else {
            alert('Máximo de 15 linhas atingido.');
        }
    });

    function adicionarLinha() {
        // Seleciona o contêiner de entradas
        const inputContainer = document.getElementById('inputContainer');

        // Clona a primeira linha de entrada
        const novaLinha = inputContainer.querySelector('.input-row').cloneNode(true);

        // Limpa os valores dos inputs clonados
        const inputs = novaLinha.querySelectorAll('input[type="text"]');
        inputs.forEach(input => {
            input.value = ''; // Limpa o valor do input
        });

        // Atualiza o número da linha
        linhaCount++;
        novaLinha.querySelector('input[id="numeroLinha"]').value = linhaCount; // Atualiza o número da linha

        // Adiciona a nova linha ao contêiner
        inputContainer.appendChild(novaLinha);
    }

    document.getElementById('submitButton').addEventListener('click', function(event) {
        event.preventDefault(); // Impede o envio padrão do formulário

        // Capturando os valores dos inputs principais
        const representante_id = document.getElementById('representante').value;
        const comprador_id = document.getElementById('comprador').value;
        const nomeComprador = document.querySelector('#comprador option:checked').text; // Obtém o nome do comprador selecionado
        const data = document.getElementById('data').value;
        const hora = document.getElementById('hora').value;
        const apelido = document.getElementById('apelido').value;
        const cpf_cnpj = document.getElementById('cpf_cnpj').value;
        const rg = document.getElementById('rg').value;
        const maquina_id = document.getElementById('maquina').value;
        const nomeMaquina = document.querySelector('#maquina option:checked').text; // Obtém o nome da máquina selecionada
        const tipo = document.getElementById('tipo').value;

        // Capturando os valores de todas as linhas
        const linhas = [];
        const inputContainer = document.getElementById('inputContainer');
        const inputRows = inputContainer.querySelectorAll('.input-row'); // Seleciona todas as linhas

        inputRows.forEach(row => {
            const numeroLinha = row.querySelector('input[id="numeroLinha"]').value; // Captura o número da linha
            let kg = row.querySelector('input[id="kg"]').value;
            let pd = row.querySelector('input[id="pd"]').value;
            let pt = row.querySelector('input[id="pt"]').value;
            let rh = row.querySelector('input[id="rh"]').value;
            let valor_kg = row.querySelector('input[id="valor_kg"]').value;
            let valor = row.querySelector('input[id="valor"]').value;

            // Convertendo valores decimais
            kg = convertDecimal(kg);
            pd = convertDecimal(pd);
            pt = convertDecimal(pt);
            rh = convertDecimal(rh);
            valor_kg = convertDecimal(valor_kg);
            valor = convertDecimal(valor);

            // Adicionando os dados da linha ao array
            linhas.push({
                numeroLinha: numeroLinha,
                kg: kg,
                pd: pd,
                pt: pt,
                rh: rh,
                valor_kg: valor_kg,
                valor: valor
            });
        });

        // Criando o objeto para enviar
        const dataToSend = {
            representante_id: representante_id,
            comprador_id: comprador_id,
            nome_comprador: nomeComprador, 
            data: data,
            hora: hora,
            apelido: apelido,
            cpf_cnpj: cpf_cnpj,
            rg: rg,
            maquina_id: maquina_id,
            nome_maquina: nomeMaquina, // Adicione isso
            tipo: tipo,
            linhas: JSON.stringify(linhas) // Enviando todas as linhas
        };

        // Enviando os dados via fetch
        fetch('/api/upload-provisorio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            // Adicione aqui lógica para mostrar uma mensagem de sucesso ao usuário
        })
        .catch(error => {
            console.error('Error:', error);
            // Adicione aqui lógica para mostrar uma mensagem de erro ao usuário
        });
    });
})

function formatInput(input) {
    let value = input.value;

    // Remove caracteres que não sejam dígitos ou vírgula
    value = value.replace(/[^\d,]/g, '');

    // Se o valor estiver vazio, define um padrão
    if (value.trim() === '') {
        input.value = '0,00';
        return;
    }

    // Verifica se há mais de uma vírgula e mantém apenas a última
    const commaIndex = value.lastIndexOf(',');
    if (commaIndex !== -1) {
        // Remove todas as vírgulas exceto a última
        value = value.slice(0, commaIndex).replace(/,/g, '') + ',' + value.slice(commaIndex + 1);
    }

    // Converte o valor para um número, trocando vírgula por ponto
    let numberValue = parseFloat(value.replace(',', '.'));

    // Se o valor não for um número, sai da função
    if (isNaN(numberValue)) {
        return;
    }

    // Formata os campos 'valor' e 'valor_kg' sem ponto de milhar e com duas casas decimais
    if (input.id === 'valor' || input.id === 'valor_kg') {
        input.value = numberValue.toFixed(2).replace('.', ',');
    } else {
        // Para outros campos, mantém a formatação com 4 casas decimais
        input.value = numberValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        }).replace('.', ','); // Troca o ponto de volta para vírgula
    }
}

// Conectar a função ao evento de perda de foco (blur) apenas nos campos format-input
document.querySelectorAll('.format-input').forEach((input) => {
    input.addEventListener('blur', () => formatInput(input));
});



let isSidebarOpen = false;

function toggleSidebar() {
    const sidebar = document.getElementById("mySidebar");
    const triggerArea = document.querySelector(".trigger-area");
    const toggleIcon = document.getElementById("toggleIcon");

    if (isSidebarOpen) {
        sidebar.style.width = "0";
        triggerArea.classList.remove("sidebar-open");
        // Mudar o ícone de volta para a seta apontando para a direita
        toggleIcon.classList.remove("fa-chevron-left");
        toggleIcon.classList.add("fa-chevron-right");
    } else {
        sidebar.style.width = "250px";
        triggerArea.classList.add("sidebar-open");
        // Mudar o ícone para a seta apontando para a esquerda
        toggleIcon.classList.remove("fa-chevron-right");
        toggleIcon.classList.add("fa-chevron-left");
    }

    isSidebarOpen = !isSidebarOpen; // Inverte o estado de abertura
}

function openModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "block"; // Mostrar o modal
}

function closeModal() {
    const modal = document.getElementById("myModal");
    modal.style.display = "none"; // Ocultar o modal
}

// Fechar o modal se o usuário clicar fora da área do conteúdo
window.onclick = function (event) {
    const modal = document.getElementById("myModal");
    if (event.target === modal) {
        closeModal();
    }
};

$('#myModal').on('show.bs.modal', function () {
    console.log("Modal aberto, carregando representantes...");
    loadRepresentantes();
});

$('#formCadastroComprador').on('submit', function (event) {
    event.preventDefault(); // Impede o envio do formulário para teste
    // Aqui você pode adicionar o código para processar o formulário
});
