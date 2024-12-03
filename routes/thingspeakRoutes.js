const express = require('express');
const router = express.Router();
const thingspeakController = require('../controllers/thingspeakController');

// Definindo a rota para acessar os dados do ThingSpeak
router.get('/', thingspeakController.getThingSpeakData);

module.exports = router;
