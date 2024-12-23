const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  tempLimit: { type: Number, required: true },
  humidityLimit: { type: Number, required: true },
  devices: { type: [String], default: [] }, // Corrigir para "devices"
});

module.exports = mongoose.model('User', userSchema);
