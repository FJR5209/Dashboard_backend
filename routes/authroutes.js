const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// Middleware para verificar o token de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ msg: 'Token de autenticação não fornecido' });
  }

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token inválido' });
  }
};

// Middleware para verificar se o usuário é um administrador
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Acesso negado. Somente administradores podem acessar esta rota.' });
  }
  next();
};

// Rota para obter dados do usuário logado
router.get('/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    res.json(user); // Retorna os dados do usuário autenticado
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao buscar os dados do usuário' });
  }
});

// Rota para cadastro de usuários - Protegida por autenticação e autorização de administrador
router.post('/users/cadastro', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, email, password, tempLimit, role, humidityLimit } = req.body;

  // Validação de campos obrigatórios
  if (!name || !email || !password || !tempLimit || !role || !humidityLimit) {
    return res.status(400).json({ msg: 'Todos os campos são obrigatórios!' });
  }

  try {
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'Usuário já cadastrado com este email.' });
    }

    // Criptografar a senha do usuário
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Criar e salvar o novo usuário
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      tempLimit,
      role,
      humidityLimit,
    });

    await newUser.save();

    res.status(201).json({ msg: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao cadastrar o usuário.' });
  }
});

// Rota para login, gera um token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: 'Email e senha são obrigatórios' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Usuário não encontrado' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Senha incorreta' });
    }

    // Gera o token JWT para o usuário
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// Rota para buscar todos os usuários (somente admin)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    // Verifica se o usuário é admin
    if (req.user.role === 'admin') {
      // Se for admin, retorna todos os usuários
      const users = await User.find().select('-password'); // Remove a senha dos usuários
      return res.json(users);
    }

    // Se o usuário não for admin, retorna apenas o próprio usuário
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao buscar os usuários' });
  }
});

// Rota para atualizar cadastro de um usuário
router.put('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, email, tempLimit, humidityLimit, role } = req.body;

  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ msg: 'Acesso negado. Você só pode atualizar seus próprios dados.' });
  }

  try {
    const updates = { name, email, tempLimit, humidityLimit };
    if (req.user.role === 'admin' && role) {
      updates.role = role;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    res.status(200).json({
      msg: 'Usuário atualizado com sucesso!',
      updatedData: updatedUser,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao atualizar o usuário' });
  }
});

module.exports = router;
