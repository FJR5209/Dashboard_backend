const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Device = require('../models/Device');
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
// Rota para cadastro de usuários - Protegida por autenticação e autorização de administrador
router.post('/users/cadastro', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, email, password, tempLimit, role, humidityLimit, deviceId } = req.body;

  if (!name || !email || !password || !tempLimit || !role || !humidityLimit || !deviceId) {
    return res.status(400).json({ msg: 'Todos os campos são obrigatórios!' });
  }

  try {
    console.log("Iniciando processo de cadastro...");
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Usuário já cadastrado com este email.");
      return res.status(400).json({ msg: 'Usuário já cadastrado com este email.' });
    }

    // Verificar se o Dispositivo Existe no Banco
    const existingDevice = await Device.findOne({ deviceId });
    if (!existingDevice) {
      console.log("Dispositivo não encontrado no sistema.");
      return res.status(400).json({ msg: 'Dispositivo não encontrado no sistema.' });
    }

    console.log("Dispositivo encontrado:", existingDevice);

    // Criptografar a senha do usuário
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    console.log("Senha criptografada.");

    // Criar e salvar o novo usuário
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      tempLimit,
      role,
      humidityLimit,
      devices: [deviceId], // Associando o dispositivo ao usuário
    });

    console.log("Novo usuário a ser salvo:", newUser);

    await newUser.save();

    console.log("Usuário cadastrado com sucesso!");
    res.status(201).json({ msg: 'Usuário cadastrado com sucesso!' });
  } catch (err) {
    console.error("Erro ao cadastrar o usuário:", err.message);
    res.status(500).json({ msg: 'Erro ao cadastrar o usuário.', error: err.message });
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

// Rota para obter dados do usuário logado
router.get('/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    res.json(user); // Inclui o campo devices no retorno
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao buscar os dados do usuário' });
  }
});

// Rota para listar usuários - Somente administradores
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao buscar usuários' });
  }
});

// Rota para buscar um usuário específico
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ msg: 'Acesso negado.' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao buscar o usuário' });
  }
});

// Rota para excluir um usuário - Somente administradores
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Usuário removido com sucesso' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao remover o usuário' });
  }
});
// Rota para atualizar cadastro de um usuário - Protegida por autenticação
router.put('/users/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, email, tempLimit, humidityLimit, role, devices } = req.body;

  // Verificar se o usuário autenticado tem permissão
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ msg: 'Acesso negado. Você só pode atualizar seus próprios dados.' });
  }

  try {
    // Buscar o usuário a ser atualizado
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado.' });
    }

    // Atualizar campos básicos
    if (name) user.name = name;
    if (email) user.email = email;
    if (tempLimit) user.tempLimit = tempLimit;
    if (humidityLimit) user.humidityLimit = humidityLimit;
    if (role && req.user.role === 'admin') user.role = role; // Apenas administradores podem atualizar o papel

    // Validar e atualizar dispositivos
    if (devices && Array.isArray(devices)) {
      console.log("Dispositivos recebidos:", devices);

      // Verificar se todos os dispositivos existem no banco
      const existingDevices = await Device.find({ deviceId: { $in: devices } });
      const validDeviceIds = existingDevices.map((device) => device.deviceId);

      console.log("Dispositivos válidos encontrados no banco:", validDeviceIds);

      // Verificar se todos os dispositivos enviados são válidos
      const invalidDevices = devices.filter((deviceId) => !validDeviceIds.includes(deviceId));
      if (invalidDevices.length > 0) {
        return res.status(400).json({
          msg: 'Alguns dispositivos não foram encontrados no banco de dados.',
          invalidDevices,
        });
      }

      // Atualizar os dispositivos do usuário
      user.devices = validDeviceIds;
    }

    // Salvar alterações no banco
    const updatedUser = await user.save();

    res.status(200).json({
      msg: 'Usuário atualizado com sucesso!',
      updatedData: updatedUser,
    });
  } catch (err) {
    console.error('Erro ao atualizar o usuário:', err.message);
    res.status(500).json({ msg: 'Erro ao atualizar o usuário.', error: err.message });
  }
});


module.exports = router;