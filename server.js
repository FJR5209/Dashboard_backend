const express = require('express');
const connectDB = require('./config/db'); // Importando a função de conexão com o DB
const cors = require('cors');
const authRoutes = require('./routes/authroutes'); // Importando as rotas de autenticação
const thingspeakRoutes = require('./routes/thingspeakRoutes'); // Importando as rotas do ThingSpeak
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

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

// Rota para cadastrar um novo usuário
app.post('/api/auth/users/cadastro', (req, res) => {
  const { name, email, password, tempLimit, role, humidityLimit } = req.body;

  // Validação simples de dados
  if (!name || !email || !password || !tempLimit || !role || !humidityLimit) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios!' });
  }

  // Aqui, você pode adicionar lógica para salvar os dados no banco de dados
  // Exemplo:
  // User.create({ name, email, password, tempLimit, role, humidityLimit })

  return res.status(201).json({ message: 'Usuário cadastrado com sucesso!' });
});

// Inicializar o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
