const mongoose = require('mongoose');

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://sensor_temp:w0M41OBF4Qr6A0KM@bdsensor.0jdkz.mongodb.net/');
    console.log('Conectado ao MongoDB');
  } catch (err) {
    console.error('Erro ao conectar com MongoDB', err);
    process.exit(1); // Encerra o processo caso a conexão falhe
  }
};

module.exports = connectDB;
