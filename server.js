const express = require('express');
const connectDB = require('./config/db'); // Importando a função de conexão com o DB
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

// Inicializar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
