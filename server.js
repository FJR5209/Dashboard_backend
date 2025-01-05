const express = require('express');
const connectDB = require('./config/db'); // Conexão com o banco
const cors = require('cors');
const Alert = require('./models/Alert');  // Verifique se o caminho está correto
const { triggerAlert } = require('./controllers/alertController');
const authRoutes = require('./routes/authroutes'); // Rotas de autenticação
const mongoose = require('mongoose');
const User = require('./models/User'); // Modelo do usuário
const Device = require('./models/Device'); // Modelo do dispositivo
const deviceRoutes = require('./routes/deviceRoutes'); // Rotas de dispositivos
const nodemailer = require('nodemailer');
const router = express.Router();
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
  const { name, email, password, tempLimit, role, humidityLimit } = req.body;

  // Validação simples de dados
  if (!name || !email || !password || !tempLimit || !role || !humidityLimit) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
  }

  return res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
});

// Rota para salvar ou atualizar os dados do dispositivo
app.post('/dados', async (req, res) => {
  const { deviceId, temperatura, umidade, userId, userName, timeCollected } = req.body;
  console.log(req.body); // Log para verificar os dados recebidos

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
    res.status(500).json({ message: 'Erro ao salvar dados', error });
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

// Rota para vincular um dispositivo a um usuário
app.post('/api/users/:userId/devices', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userName, currentTemperature, currentHumidity, timeCollected } = req.body;

    if (!userName || !currentTemperature || !currentHumidity || !timeCollected) {
      return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
    }

    // Salva o dispositivo no banco de dados
    await newDevice.save();

    // Vincula o dispositivo ao usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado!' });
    }

    user.devices.push(newDevice._id); // Adiciona o ID do dispositivo ao usuário
    await user.save();

    res.status(200).json({ message: 'Dispositivo vinculado com sucesso!', device: newDevice, user });
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

// Rota para listar todos os dispositivos
app.get('/dispositivos', async (req, res) => {
  try {
    const dispositivos = await Device.find(); // Buscar todos os dispositivos
    res.status(200).json(dispositivos); // Retornar os dispositivos em formato JSON
  } catch (error) {
    res.status(500).json({ message: "Erro ao listar dispositivos", error });
  }
});

// Configuração do transportador de e-mail (substitua pelas configurações reais)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,  // Defina seu e-mail aqui
    pass: process.env.EMAIL_PASS   // Defina a senha do e-mail
  }
});

// Rota POST para receber e processar alertas
app.post('/api/alerts', async (req, res) => {
  const { userId, temperatura, umidade } = req.body;

  // Verificando os dados recebidos
  console.log("Dados recebidos:", req.body);
  console.log(`UserId: ${userId}, Temperatura: ${temperatura}, Umidade: ${umidade}`);

  if (!userId || temperatura == null || umidade == null) {
    return res.status(400).json({ msg: 'Todos os campos são obrigatórios!' });
  }

  try {
    // Buscando o usuário no banco de dados
    const user = await User.findById(userId);
    console.log("Usuário encontrado:", user);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado.' });
    }

    // Garantindo que os limites de temperatura e umidade estão sendo usados corretamente
    const tempLimit = parseFloat(user.tempLimit);
    const humidityLimit = parseFloat(user.humidityLimit);
    const currentTemp = parseFloat(temperatura);
    const currentHum = parseFloat(umidade);

    console.log(`Limite de Temperatura: ${tempLimit}, Temperatura Recebida: ${currentTemp}`);
    console.log(`Limite de Umidade: ${humidityLimit}, Umidade Recebida: ${currentHum}`);

    // Verificando se os limites foram excedidos (qualquer um dos dois)
    const temperatureExceeded = currentTemp > tempLimit;
    const humidityBelowLimit = currentHum < humidityLimit;

    console.log(`Temperatura Excedida: ${temperatureExceeded}, Umidade Abaixo do Limite: ${humidityBelowLimit}`);

    // Alterado de '&&' para '||' (dispara alerta se qualquer condição for atendida)
    if (temperatureExceeded || humidityBelowLimit) {
      // Criando o alerta
      const alert = new Alert({
        userId,
        tempLimit,
        humidityLimit,
        alertType: 'email',
        temperature: currentTemp,
        humidity: currentHum,
      });

      // Salvando o alerta
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
        console.log('E-mail enviado com sucesso:', info);
      } catch (emailErr) {
        console.error('Erro ao enviar o e-mail:', emailErr);
        return res.status(500).json({ msg: 'Erro ao enviar o alerta por e-mail.' });
      }

      return res.status(200).json({ msg: 'Alerta disparado e registrado no banco de dados com sucesso!' });
    }

    // Caso os limites não sejam excedidos
    return res.status(200).json({ msg: 'Nenhum limite foi excedido.' });

  } catch (err) {
    console.error('Erro ao registrar ou disparar o alerta:', err.message);
    return res.status(500).json({ msg: 'Erro ao registrar ou disparar o alerta.' });
  }
});


module.exports = router;

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
