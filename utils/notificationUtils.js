const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração do transportador para enviar e-mail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Função para enviar um e-mail de alerta
async function sendEmail(userId, currentTemp, currentHumidity) {
  const user = await User.findById(userId);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: 'Alerta de Temperatura e Umidade',
    text: `Os limites de temperatura e umidade foram ultrapassados.\nTemperatura atual: ${currentTemp}°C\nUmidade atual: ${currentHumidity}%`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('E-mail enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar o e-mail', error);
  }
}

module.exports = { sendEmail };
