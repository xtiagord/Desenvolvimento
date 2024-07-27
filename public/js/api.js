async function fetchRepresentantes() {
    const response = await fetch('/api/representantes');
    if (!response.ok) {
        throw new Error('Erro ao carregar representantes');
    }
    return response.json();
}

async function fetchFornecedores() {
    const response = await fetch('/fornecedores');
    if (!response.ok) {
        throw new Error('Erro ao carregar fornecedores');
    }
    return response.json();
}

async function fetchEquipamentos() {
    const response = await fetch('/api/equipamentos');
    if (!response.ok) {
        throw new Error('Erro ao carregar equipamentos');
    }
    return response.json();
}
