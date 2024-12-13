const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const { triggerAlert } = require('../controllers/alertController');
const User = require('../models/User');
require('dotenv').config();
const moment = require('moment');  // Adiciona a biblioteca moment para manipulação de datas

const router = express.Router(); // Inicializa o router do Express

// Verificação de variáveis de ambiente
if (!process.env.THINGSPEAK_CHANNEL_ID || !process.env.THINGSPEAK_API_KEY) {
  console.error('Erro: THINGSPEAK_CHANNEL_ID ou THINGSPEAK_API_KEY não configuradas no .env.');
  process.exit(1);
}

// Função para buscar os dados do ThingSpeak
const getThingSpeakData = async () => {
  try {
    const response = await axios.get(
      `https://api.thingspeak.com/channels/${process.env.THINGSPEAK_CHANNEL_ID}/feeds.json?api_key=${process.env.THINGSPEAK_API_KEY}&results=2`
    );
    const feeds = response.data.feeds;

    if (!feeds || feeds.length === 0) {
      console.log('Nenhum dado disponível no ThingSpeak.');
      return;
    }

    // Pegando os últimos dados coletados
    const latestData = feeds[feeds.length - 1];
    const currentTemperature = parseFloat(latestData.field1); // Temperatura
    const currentHumidity = parseFloat(latestData.field2); // Umidade

    console.log(`Últimos dados - Temperatura: ${currentTemperature}°C, Umidade: ${currentHumidity}%`);

    // Formatando a hora atual para exibição (exemplo: "22:40h")
    const currentTime = moment(latestData.created_at).format('HH:mm') + 'h';

    console.log(`Hora dos dados coletados: ${currentTime}`);

    // Verificando os limites para cada usuário
    const users = await User.find();
    for (const user of users) {
      if (currentTemperature > user.tempLimit || currentHumidity > user.humidityLimit) {
        try {
          // Criar o alerta com a hora formatada
          const alert = {
            userName: user.name,  // Nome do usuário
            userId: user._id,
            currentTemperature,
            currentHumidity,
            createdAt: new Date(),
            timeCollected: currentTime,  // Hora formatada
          };

          // Armazenar o alerta
          storeAlert(alert);

          // Enviar o alerta (por exemplo, por email, SMS, etc.)
          await triggerAlert(
            { body: { userId: user._id, currentTemperature, currentHumidity } },
            { status: (status) => ({ json: (message) => console.log(message) }) }
          );
        } catch (error) {
          console.error(`Erro ao enviar alerta para o usuário ${user._id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Erro ao buscar dados do ThingSpeak:', error.message || error);
  }
};

// Agendar a coleta e verificação dos dados a cada 1 minuto
cron.schedule('*/1 * * * *', () => {
  console.log('Coletando dados do ThingSpeak...');
  getThingSpeakData();
});

// Adicionar uma rota para buscar os alertas
let alerts = []; // Armazena os alertas gerados (você pode substituir isso por um banco de dados)

router.get('/alerts', async (req, res) => {
  try {
    res.json(alerts); // Retorna os alertas como resposta
  } catch (error) {
    res.status(500).json({ msg: 'Erro ao buscar alertas.', error: error.message });
  }
});

// Adicione uma rota para testar a coleta manual de dados
router.get('/fetch', async (req, res) => {
  try {
    await getThingSpeakData();
    res.json({ msg: 'Dados coletados manualmente com sucesso.' });
  } catch (error) {
    res.status(500).json({ msg: 'Erro ao coletar dados manualmente.', error: error.message });
  }
});

// Função para armazenar alertas (você pode personalizar com um banco de dados)
const storeAlert = (alert) => {
  alerts.push(alert); // Armazena alertas na lista (use banco de dados em produção)
};

module.exports.getThingSpeakData = getThingSpeakData;
module.exports.router = router;
module.exports.storeAlert = storeAlert;
