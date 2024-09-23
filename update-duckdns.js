const fetch = require('node-fetch');

// Seu token DuckDNS e subdomínio
const DUCKDNS_TOKEN = '9cd295ad-be66-410b-8f0c-3aeb7dba9fa2';
const DUCKDNS_SUBDOMINIO = 'valmarc';

// Função para capturar o URL do Ngrok
async function obterUrlNgrok() {
  try {
    const res = await fetch('http://127.0.0.1:4040/api/tunnels');
    const data = await res.json();
    if (data.tunnels.length > 0) {
      const publicUrl = data.tunnels[0].public_url;
      console.log(`Novo URL do Ngrok: ${publicUrl}`);
      return publicUrl;
    } else {
      throw new Error('Nenhum túnel ativo encontrado.');
    }
  } catch (err) {
    console.error('Erro ao obter o URL do Ngrok:', err);
    throw err;
  }
}

// Função para atualizar o IP no DuckDNS
async function atualizarDuckDNS(ip) {
  const url = `https://www.duckdns.org/update?domains=${DUCKDNS_SUBDOMINIO}&token=${DUCKDNS_TOKEN}&ip=${ip}`;
  try {
    const res = await fetch(url);
    const body = await res.text();
    console.log(`Resposta do DuckDNS: ${body}`);
    if (body === 'OK') {
      console.log('DuckDNS atualizado com sucesso!');
    } else {
      throw new Error('Erro ao atualizar DuckDNS: ' + body);
    }
  } catch (err) {
    console.error('Erro ao atualizar DuckDNS:', err);
    throw err;
  }
}

// Função para obter o IP público
async function obterIpPublico() {
  const res = await fetch('https://api.ipify.org?format=json');
  const data = await res.json();
  return data.ip;
}

// Função principal que obtém o IP e atualiza o DuckDNS
async function atualizarDNSComNgrok() {
  try {
    const urlNgrok = await obterUrlNgrok(); // Chama a função para obter o URL do Ngrok
    const ipPublico = await obterIpPublico();
    console.log(`Atualizando DuckDNS com IP: ${ipPublico}`);
    await atualizarDuckDNS(ipPublico);
  } catch (err) {
    console.error('Erro ao atualizar o DNS:', err);
  }
}

// Iniciar o script
atualizarDNSComNgrok();
setInterval(atualizarDNSComNgrok, 5 * 60 * 1000); // Atualiza a cada 5 minutos
