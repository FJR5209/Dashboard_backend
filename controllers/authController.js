const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Função para registrar um usuário
async function register(req, res) {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Usuário registrado com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar o usuário', error });
  }
}

// Função para login do usuário
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Verifica se o usuário existe no banco de dados
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verifica se a senha fornecida é válida
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Senha incorreta' });
    }

    // Gera o token JWT com as informações do usuário
    const payload = {
      user: {
        id: user._id,
        role: user.role // Inclui o papel do usuário no token
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Retorna o token no resultado
    res.status(200).json({
      message: 'Login bem-sucedido',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role // Retorna o papel também na resposta
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error.message);
    res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
  }
}


module.exports = { register, login };
