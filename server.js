const express = require('express');
const connectDB = require('./config/db'); // Conexão com o banco
const cors = require('cors');
const authRoutes = require('./routes/authroutes'); // Importando as rotas de autenticação
const thingspeakRoutes = require('./routes/thingspeakRoutes'); // Importando as rotas do ThingSpeak
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

app.use('/api/thingspeak', thingspeakRoutes.router);

// Defina a função getThingSpeakData
async function getThingSpeakData() {
  try {
    const response = await axios.get('https://api.thingspeak.com/channels/CHANNEL_ID/feeds.json?api_key=YOUR_API_KEY');
    console.log(response.data);
  } catch (error) {
    console.error('Erro ao buscar dados do ThingSpeak:', error);
  }
}

console.log(typeof getThingSpeakData); // Deve exibir 'function'
getThingSpeakData();


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

// Inicializar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
