const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const cookie = require('cookie'); // Biblioteca para manipulação de cookies

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

    // Configurações para o cookie (https, httpOnly, e sameSite)
    const cookieOptions = {
      httpOnly: true, // Não acessível via JavaScript
      secure: process.env.NODE_ENV === 'production', // Envia apenas em conexões HTTPS
      sameSite: 'Strict', // Não envia cookies em requisições cross-site
      maxAge: 3600000, // 1 hora
    };

    // Define o cookie com o token JWT
    res.setHeader('Set-Cookie', cookie.serialize('authToken', token, cookieOptions));

    // Retorna uma resposta indicando sucesso
    res.status(200).json({
      message: 'Login bem-sucedido',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role // Retorna o papel também
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error.message);
    res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
  }
}

// Função para logout do usuário (remover o cookie)
async function logout(req, res) {
  try {
    // Remove o cookie de autenticação
    res.setHeader('Set-Cookie', cookie.serialize('authToken', '', { maxAge: -1 }));

    res.status(200).json({ message: 'Logout bem-sucedido' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao fazer logout', error: error.message });
  }
}

module.exports = { register, login, logout };
