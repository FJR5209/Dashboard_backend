const express = require('express');
const router = express.Router();
const Device = require('../models/Device'); // Importa o modelo Device

// Rota para buscar o último dado de um dispositivo específico
router.get('/devices/:deviceId/latest', async (req, res) => {
  const { deviceId } = req.params;

  try {
    const latestDevice = await Device.findOne({ deviceId }).sort({ timeCollected: -1, _id: -1 });

    if (!latestDevice) {
      return res.status(404).json({ msg: `Nenhum dado encontrado para o dispositivo ${deviceId}` });
    }

    // Ajustando o horário para diminuir 2 horas (em milissegundos)
    const adjustedTime = new Date(latestDevice.timeCollected);
    adjustedTime.setHours(adjustedTime.getHours() - 2); // Subtrai 2 horas

    // Atualiza o objeto com o horário ajustado
    latestDevice.timeCollected = adjustedTime;

    res.status(200).json(latestDevice);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao buscar o último dado do dispositivo' });
  }
});

module.exports = router;
