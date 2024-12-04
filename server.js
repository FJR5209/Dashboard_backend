const express = require('express');
const connectDB = require('./config/db'); // Importando a função de conexão com o DB
const cors = require('cors');
const authRoutes = require('./routes/authroutes'); // Importando as rotas de autenticação
const jwt = require('jsonwebtoken'); // Importando a biblioteca JWT
require('dotenv').config();
const mongoose = require('mongoose');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Conectar ao banco de dados
connectDB();

// Definir schema do MongoDB para dados do sensor
const sensorSchema = new mongoose.Schema({
  userId: String, // Identificador do usuário
  temperature: Number, // Temperatura enviada pelo ESP8266
  humidity: Number, // Umidade enviada pelo ESP8266
  timestamp: { type: Date, default: Date.now } // Data e hora do registro
});

const SensorData = mongoose.model('SensorData', sensorSchema);

// Middleware para verificar o token e extrair o userId
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']; // Obter token do header de autorização
  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Adiciona o userId ao objeto de requisição
    next();
  } catch (error) {
    res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};

// Rota para receber dados do ESP8266
app.post('/api/sensor', verifyToken, async (req, res) => {
  try {
    const { temperature, humidity } = req.body;
    const userId = req.userId; // Obtido do middleware

    // Validar os dados recebidos
    if (temperature == null || humidity == null) {
      return res.status(400).json({ error: 'Dados incompletos. Certifique-se de enviar temperature e humidity.' });
    }

    // Salvar os dados no MongoDB
    const newData = new SensorData({ userId, temperature, humidity });
    await newData.save();

    res.status(200).json({ message: 'Dados do sensor salvos com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar dados do sensor:', error);
    res.status(500).json({ error: 'Erro ao salvar dados do sensor.' });
  }
});

// Rota para buscar dados do sensor com base no token do usuário
app.get('/api/sensor', verifyToken, async (req, res) => {
  try {
    const userId = req.userId; // Obtido do middleware

    // Buscar dados no MongoDB com base no userId
    const data = await SensorData.find({ userId }).sort({ timestamp: -1 });

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Nenhum dado encontrado para este usuário.' });
    }

    // Formatar a resposta para a estrutura esperada pela aplicação frontend
    const formattedData = {
      feeds: data.map(item => ({
        created_at: item.timestamp.toISOString(),
        field1: item.temperature,
        field2: item.humidity,
      })),
    };

    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Erro ao buscar dados do sensor:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do sensor.' });
  }
});

// Usando as rotas de autenticação
app.use('/api/auth', authRoutes);

// Rota de exemplo
app.get('/', (req, res) => {
  res.send('Servidor rodando');
});

// Inicializar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
