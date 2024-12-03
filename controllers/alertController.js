const Alert = require('../models/Alert');
const User = require('../models/User');
const { sendEmail } = require('./utils/notificationUtils');  // Função de envio de e-mail

// Função para criar um alerta
async function createAlert(req, res) {
  const { userId, tempLimit, humidityLimit } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    const newAlert = new Alert({
      userId,
      tempLimit,
      humidityLimit,
      alertType: 'email',  // Envio de alerta apenas por e-mail
    });

    await newAlert.save();

    res.status(201).json({ msg: 'Alerta criado com sucesso', alert: newAlert });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erro ao criar alerta', error });
  }
}

// Função para disparar o alerta
async function triggerAlert(req, res) {
  const { userId, currentTemp, currentHumidity } = req.body;

  try {
    const alert = await Alert.findOne({ userId });
    if (!alert) {
      return res.status(404).json({ msg: 'Alerta não encontrado' });
    }

    // Verificar se os limites foram ultrapassados
    if (currentTemp > alert.tempLimit || currentHumidity > alert.humidityLimit) {
      // Disparar o alerta por e-mail
      await sendEmail(userId, currentTemp, currentHumidity);

      res.status(200).json({ msg: 'Alerta disparado com sucesso' });
    } else {
      res.status(200).json({ msg: 'Valores dentro dos limites' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erro ao disparar o alerta', error });
  }
}

module.exports = { createAlert, triggerAlert };
