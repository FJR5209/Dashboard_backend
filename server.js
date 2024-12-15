const express = require('express');
const connectDB = require('./config/db'); // Conexão com o banco
const cors = require('cors');
const authRoutes = require('./routes/authroutes'); // Rotas de autenticação
const thingspeakRoutes = require('./routes/thingspeakRoutes'); // Rotas do ThingSpeak
const mongoose = require('mongoose');
const User = require('./models/User'); // Modelo do usuário
const SensorData = require('./models/SensorDatas'); // Modelo dos dados do sensor
require('dotenv').config();


const app = express();

// Configuração do CORS
const corsOptions = {
  origin: '*', // Permitindo qualquer origem (substitua '*' por 'http://localhost:3000' se quiser restringir ao seu frontend)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permitindo métodos específicos
  allowedHeaders: ['Content-Type', 'Authorization'], // Permitindo headers específicos
  credentials: true, // Permitir o envio de cookies e credenciais (se necessário)
  preflightContinue: false, // Previne que o preflight continue em caso de redirecionamento
  optionsSuccessStatus: 200, // Configuração para o código de sucesso do preflight
};

// Middleware
app.use(cors(corsOptions)); // Usando as opções configuradas de CORS
app.use(express.json());

// Conectar ao banco de dados
connectDB();

// Usando as rotas de autenticação
app.use('/api/auth', authRoutes); // Definindo o caminho base para autenticação

// Usando as rotas do ThingSpeak
app.use('/api/thingspeak', thingspeakRoutes); // Definindo o caminho base para a rota do ThingSpeak

// Rota de exemplo
app.get('/', (req, res) => {
  res.send('Servidor rodando');
});

// Rota para cadastrar um novo usuário (Caso você queira manter uma rota para cadastro diretamente no server)
app.post('/api/auth/users/cadastro', (req, res) => {
  const { name, email, password, tempLimit, role, humidityLimit } = req.body;

  // Validação simples de dados
  if (!name || !email || !password || !tempLimit || !role || !humidityLimit) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
  }

  return res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
});

// Rota para receber dados do ESP8266
app.post('/dados', async (req, res) => {
  try {
    const { id: deviceId, temperatura, umidade } = req.body;

    if (!deviceId || temperatura === undefined || umidade === undefined) {
      return res.status(400).json({ message: 'Dados incompletos enviados!' });
    }

    const newData = new SensorData({ deviceId, temperatura, umidade });
    await newData.save();

    res.status(201).json({ message: 'Dados salvos com sucesso!', data: newData });
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    res.status(500).json({ message: 'Erro ao salvar os dados no banco de dados.' });
  }
});

// Rota para excluir todos os dados de um dispositivo pelo deviceId
app.delete('/dados/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Remover os dados do banco de dados com base no deviceId
    const result = await SensorData.deleteMany({ deviceId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Nenhum dado encontrado para este dispositivo.' });
    }

    res.status(200).json({ message: 'Dados excluídos com sucesso!', deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Erro ao excluir dados:', error);
    res.status(500).json({ message: 'Erro ao excluir os dados no banco de dados.' });
  }
});

// Rota para buscar todos os dados de um dispositivo pelo deviceId
app.get('/dados/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const data = await SensorData.find({ deviceId });

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Nenhum dado encontrado para este dispositivo.' });
    }

    res.status(200).json({ message: 'Dados encontrados!', data });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ message: 'Erro ao buscar os dados no banco de dados.' });
  }
});

// Rota para vincular um dispositivo a um usuário
app.post('/api/users/:userId/devices', async (req, res) => {
  try {
    const { userId } = req.params;
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'O ID do dispositivo é obrigatório!' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado!' });
    }

    // Adicionar o dispositivo ao array de dispositivos do usuário
    user.devices.push(deviceId);
    await user.save();

    res.status(200).json({ message: 'Dispositivo vinculado com sucesso!', user });
  } catch (error) {
    console.error('Erro ao vincular dispositivo:', error);
    res.status(500).json({ message: 'Erro ao vincular o dispositivo ao usuário.' });
  }
});

// Rota para buscar dispositivos de um usuário
app.get('/api/users/:userId/devices', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).populate('devices');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado!' });
    }

    res.status(200).json({ message: 'Dispositivos encontrados!', devices: user.devices });
  } catch (error) {
    console.error('Erro ao buscar dispositivos do usuário:', error);
    res.status(500).json({ message: 'Erro ao buscar dispositivos do usuário.' });
  }
});

// Inicializar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
