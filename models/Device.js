const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
  },
  temperatura: {
    type: Number,
    required: true,
  },
  umidade: {
    type: Number,
    required: true,
  },
  userId: {
    type: String, // Pode ser usado para rastrear o ID do usuário se necessário
    default: null,
  },
  timeCollected: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Device', DeviceSchema);
