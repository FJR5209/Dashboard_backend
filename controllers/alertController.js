const nodemailer = require('nodemailer');
const User = require('../models/User');
const Alert = require('../models/Alert'); // Importando o modelo Alert
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const triggerAlert = async (req, res) => {
  const { userId, temperatura, umidade } = req.body;

  console.log('Corpo da requisição:', req.body); // Verificando os dados recebidos

  if (!userId || temperatura == null || umidade == null) {
    return res.status(400).json({ msg: 'Todos os campos são obrigatórios!' });
  }

  try {
    // Verificando o usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado.' });
    }

    // Garantindo que os limites de temperatura e umidade estão como números
    const tempLimit = parseFloat(user.tempLimit);
    const humidityLimit = parseFloat(user.humidityLimit);

    console.log(`Limites do usuário - Temperatura: ${tempLimit}°C, Umidade: ${humidityLimit}%`);

    // Garantindo que os valores de temperatura e umidade enviados também sejam números
    const currentTemp = parseFloat(temperatura);
    const currentHum = parseFloat(umidade);

    console.log(`Temperatura recebida: ${currentTemp}°C, Umidade recebida: ${currentHum}%`);

    // Verificando se os limites foram excedidos
    const temperatureExceeded = currentTemp > tempLimit;
    const humidityBelowLimit = currentHum < humidityLimit;

    console.log(`Temperatura Excedida: ${temperatureExceeded}, Umidade Abaixo do Limite: ${humidityBelowLimit}`);

    if (temperatureExceeded && humidityBelowLimit) {
      // Criando o alerta no banco de dados
      const alert = new Alert({
        userId,
        tempLimit,
        humidityLimit,
        alertType: 'email', // Pode ser 'email' ou 'sms'
        temperature: currentTemp,
        humidity: currentHum,
      });

      // Salvando o alerta no banco de dados
      await alert.save();
      console.log('Alerta salvo no banco de dados.');

      // Enviando o e-mail de alerta
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Alerta de Limites Excedidos',
        text: `Os limites definidos foram excedidos:\nTemperatura atual: ${currentTemp}°C\nUmidade atual: ${currentHum}%`,
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        console.log('E-mail enviado com sucesso para:', user.email);
        console.log('Informações do envio:', info);
      } catch (emailErr) {
        console.error('Erro ao enviar o e-mail:', emailErr.message);
        return res.status(500).json({ msg: 'Erro ao enviar o alerta por e-mail.' });
      }

      return res.status(200).json({ msg: 'Alerta registrado e e-mail enviado com sucesso!' });
    }

    // Caso os limites não sejam excedidos, retorna mensagem
    return res.status(200).json({ msg: 'Nenhum limite foi excedido.' });

  } catch (err) {
    console.error('Erro ao registrar ou disparar o alerta:', err.message);
    return res.status(500).json({ msg: 'Erro ao registrar ou disparar o alerta.' });
  }
};

module.exports = { triggerAlert };
