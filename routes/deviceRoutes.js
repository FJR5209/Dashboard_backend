const express = require('express');
const router = express.Router();
const Device = require('../models/Device'); // Importa o modelo Device
const moment = require('moment-timezone'); // Importa o Moment.js com timezone

// Rota para buscar o último dado de um dispositivo específico
router.get('/devices/:deviceId/latest', async (req, res) => {
  const { deviceId } = req.params;

  try {
    const latestDevice = await Device.findOne({ deviceId }).sort({ timeCollected: -1, _id: -1 });

    if (!latestDevice) {
      return res.status(404).json({ msg: `Nenhum dado encontrado para o dispositivo ${deviceId}` });
    }

    // Ajustando o timeCollected para o fuso horário do Acre (UTC-5)
    const adjustedTime = moment(latestDevice.timeCollected)
      .tz('America/Rio_Branco', true) // Converte para o fuso horário do Acre (UTC-5)
      .format('YYYY-MM-DDTHH:mm:ss.SSSZ'); // Formato ISO 8601 ajustado

    // Incluindo o horário ajustado na resposta
    latestDevice.adjustedTime = adjustedTime;

    // Enviando a resposta com os dados ajustados
    res.status(200).json(latestDevice);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao buscar o último dado do dispositivo' });
  }
});

module.exports = router;
