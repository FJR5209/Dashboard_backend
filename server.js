const express = require('express');
const connectDB = require('./config/db'); // Importando a função de conexão com o DB
const cors = require('cors');
const authRoutes = require('./routes/authroutes'); // Importando as rotas de autenticação

require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Conectar ao banco de dados
connectDB();

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
