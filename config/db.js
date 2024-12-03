const mongoose = require('mongoose');

// Função para conectar ao MongoDB
const connectDB = async () => {
  try {
    const dbPassword = 'w0M41OBF4Qr6A0KM'; // Substitua pela senha correta
    const uri = `mongodb+srv://sensor_temp:${dbPassword}@bdsensor.0jdkz.mongodb.net/?retryWrites=true&w=majority&appName=bdsensor`;

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Conectado ao MongoDB');
  } catch (err) {
    console.error('Erro ao conectar com MongoDB', err);
    process.exit(1); // Encerra o processo caso a conexão falhe
  }
};

module.exports = connectDB;
