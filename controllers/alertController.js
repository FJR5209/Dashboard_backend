const nodemailer = require('nodemailer');
const User = require('../models/User'); // Modelo de usuário
require('dotenv').config();

// Configuração de transporte para envio de e-mails
const transporter = nodemailer.createTransport({
  service: 'Gmail', // ou outro serviço, como Outlook
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Função para disparar um alerta
const triggerAlert = async (req, res) => {
  const { userId, currentTemperature, currentHumidity } = req.body;

  console.log('Body da requisição:', req.body); // Verificar os dados

  // Verificar se os campos obrigatórios estão presentes
  if (!userId || currentTemperature == null || currentHumidity == null) {
    return res.status(400).json({ msg: 'Todos os campos são obrigatórios!' });
  }

  try {
    // Verifica se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado.' });
    }

    // Verifica se os limites de temperatura ou umidade foram excedidos
    const temperatureExceeded = currentTemperature > user.tempLimit; // Temperatura acima do limite
    const humidityExceeded = currentHumidity < user.humidityLimit; // Umidade abaixo do limite

    if (temperatureExceeded || humidityExceeded) {
      // Envia e-mail de alerta
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email, // Envia para o email do usuário
        subject: 'Alerta de Limites Excedidos',
        text: `Os limites definidos foram excedidos:\nTemperatura atual: ${currentTemperature}°C\nUmidade atual: ${currentHumidity}%`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('E-mail enviado com sucesso para:', user.email);
      } catch (emailErr) {
        console.error('Erro ao enviar o e-mail:', emailErr.message);
        return res.status(500).json({ msg: 'Erro ao enviar o alerta por e-mail.' });
      }

      return res.status(200).json({
        msg: 'Alerta disparado e e-mail enviado com sucesso!',
      });
    }

    return res.status(200).json({ msg: 'Nenhum limite foi excedido.' });
  } catch (err) {
    console.error('Erro ao disparar o alerta:', err.message);
    return res.status(500).json({ msg: 'Erro ao disparar o alerta.' });
  }
};

module.exports = { triggerAlert };
