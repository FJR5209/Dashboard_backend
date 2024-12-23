const express = require('express');
const connectDB = require('./config/db'); // Conexão com o banco
const cors = require('cors');
const authRoutes = require('./routes/authroutes'); // Rotas de autenticação
const mongoose = require('mongoose');
const User = require('./models/User'); // Modelo do usuário
const Device = require('./models/Device'); // Modelo do dispositivo
const deviceRoutes = require('./routes/deviceRoutes'); // Rotas de dispositivos
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

app.use('/api', deviceRoutes);    // Prefixo para rotas de dispositivos

// Usando as rotas de autenticação
app.use('/api/auth', authRoutes); // Definindo o caminho base para autenticação

// Rota de exemplo
app.get('/', (req, res) => {
  res.send('Servidor rodando');
});

// Rota para cadastrar um novo usuário (Caso você queira manter uma rota para cadastro diretamente no server)
app.post('/api/auth/users/cadastro', (req, res) => {
  const { name, email, password, tempLimit, role, humidityLimit, deviceId } = req.body;

  // Validação simples de dados
  if (!name || !email || !password || !tempLimit || !role || !humidityLimit || !deviceId) {
    return res.status(400).json({ msg: 'Todos os campos são obrigatórios!' });
  }

  return res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
});

// Rota para receber e salvar os dados do dispositivo
app.post('/dados', async (req, res) => {
  const { deviceId, temperatura, umidade, userId, userName, timeCollected } = req.body;
  console.log("Dados recebidos no servidor:", req.body); // Verificar o conteúdo dos dados

  try {
    // Verificar se já existe um dispositivo com o mesmo ID
    let device = await Device.findOne({ deviceId });

    if (device) {
      // Se o dispositivo já existe, atualizamos os dados
      device.temperatura = temperatura;
      device.umidade = umidade;
      device.userId = userId;
      device.userName = userName;
      device.timeCollected = timeCollected;
      
      // Salvar as atualizações no banco de dados
      await device.save();
      res.status(200).json({ message: 'Dados atualizados com sucesso!' });
    } else {
      // Se não existe, cria-se um novo dispositivo
      device = new Device({
        deviceId,
        temperatura,
        umidade,
        userId,
        userName,
        timeCollected
      });
      await device.save();
      res.status(201).json({ message: 'Dispositivo registrado com sucesso!' });
    }
  } catch (error) {
    console.error("Erro ao salvar os dados:", error); // Log detalhado do erro
    res.status(500).json({ message: 'Erro ao salvar dados', error: error.message });
  }
});


// Rota para excluir todos os dados de um dispositivo pelo deviceId
app.delete('/dados/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Remover os dados do banco de dados com base no deviceId
    const result = await Device.deleteMany({ deviceId });

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
    const data = await Device.find({ deviceId });

    if (!data || data.length === 0) {
      return res.status(404).json({ message: 'Nenhum dado encontrado para este dispositivo.' });
    }

    res.status(200).json({ message: 'Dados encontrados!', data });
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    res.status(500).json({ message: 'Erro ao buscar os dados no banco de dados.' });
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

// Rota para listar todos os dispositivos
app.get('/dispositivos', async (req, res) => {
  try {
    const dispositivos = await Device.find(); // Buscar todos os dispositivos
    res.status(200).json(dispositivos); // Retornar os dispositivos em formato JSON
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar dispositivos", error });
  }
});

// Inicializar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
