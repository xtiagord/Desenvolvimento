const ngrok = require('ngrok');
const dnsPacket = require('dns-packet');
const axios = require('axios');

// Configurações
const duckdnsToken = 'SEU_TOKEN_DUCKDNS';
const duckdnsDomain = 'valmarc.duckdns.org';

// Função para atualizar o registro A no DuckDNS
async function updateDuckdns(newAddress) {
  const url = `https://www.duckdns.org/update?domains=${duckdnsDomain}&token=${duckdnsToken}&ip=${newAddress}`;
  try {
    const response = await axios.get(url);
    console.log('DuckDNS atualizado com sucesso:', response.data);
  } catch (error) {
    console.error('Erro ao atualizar DuckDNS:', error);
  }
}

// Função para monitorar o túnel Ngrok e atualizar o DuckDNS
async function monitorNgrok() {
  const url = await ngrok.connect();
  console.log('Túnel Ngrok iniciado em:', url);

  // Função de callback para quando o túnel for atualizado
  ngrok.on('update', async (newUrl) => {
    console.log('Novo endereço Ngrok:', newUrl);
    const newAddress = newUrl.replace('https://', '').split(':')[0];
    await updateDuckdns(newAddress);
  });
}

// Iniciando o monitoramento
monitorNgrok();