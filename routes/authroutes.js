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
  try {
   

    if (!req.user || !req.user.role) {
      return res.status(403).json({ msg: 'Acesso negado. Usuário não autenticado ou sem informações de papel.' });
    }

    // Verifique se o papel do usuário é 'admin'
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acesso negado. Somente administradores podem acessar esta rota.' });
    }
    // Prossiga para o próximo middleware ou rota
    next();
  } catch (error) {
    console.error('Erro no middleware de administrador:', error.message);
    res.status(500).json({ msg: 'Erro no servidor ao verificar permissões de administrador' });
  }
};

module.exports = adminMiddleware;


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
    const payload = { user: { id: user.id, role:user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Retorna o token para o cliente
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// Rota para ler todos os usuários (somente para administradores, se necessário)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclui o campo de senha
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao buscar usuários' });
  }
});

// Rota para buscar um usuário específico
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
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

// Rota para cadastrar um novo usuário
router.post('/users', async (req, res) => {
  const { name, email, password, tempLimit,role, humidityLimit } = req.body;

  // Verificar se todos os campos obrigatórios foram fornecidos
  if (!name || !email || !password) {
    return res.status(400).json({ msg: 'Nome, email e senha são obrigatórios' });
  }

  try {
    // Verificar se o usuário já existe
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Usuário já existe' });
    }

    // Criar um novo usuário
    user = new User({
      name,
      email,
      password,
      tempLimit,
      role,
      humidityLimit
    });

    // Criptografar a senha
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Salvar o usuário no banco de dados
    await user.save();

    // Retornar uma resposta de sucesso
    res.status(201).json({ msg: 'Usuário criado com sucesso', user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao criar usuário' });
  }
});

router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { name, email, tempLimit, role, humidityLimit } = req.body;

  // Validação para garantir que pelo menos um campo seja fornecido
  if (!name && !email && !tempLimit && !humidityLimit && !role) {
    return res.status(400).json({ msg: 'Pelo menos um campo deve ser atualizado' });
  }

  try {
    // Atualizar os campos do usuário no banco de dados
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name,
          email,
          tempLimit,
          role,
          humidityLimit,
        },
      },
      { new: true, runValidators: true } // Retorna o documento atualizado e valida os campos
    );

    if (!updatedUser) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    res.json({ msg: 'Usuário atualizado com sucesso', user: updatedUser });
  } catch (err) {
    console.error('Erro ao atualizar o usuário:', err.message);
    res.status(500).json({ msg: 'Erro ao atualizar o usuário' });
  }
});


// Rota para excluir um usuário
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    // Verifique se o usuário está tentando excluir a si mesmo (opcional)
    if (req.user.id === user.id) {
      return res.status(400).json({ msg: 'Você não pode excluir sua própria conta' });
    }

    await user.remove();
    res.json({ msg: 'Usuário removido com sucesso' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro ao remover o usuário' });
  }
});

module.exports = router;
