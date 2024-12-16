const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  temperatura: { type: Number, required: true },
  umidade: { type: Number, required: true },
  userId: { type: String, required: false }, // Não obrigatório
  userName: { type: String, required: false }, // Não obrigatório
  currentTemperature: { type: Number, required: false }, // Não obrigatório
  currentHumidity: { type: Number, required: false }, // Não obrigatório
  timeCollected: { type: Date, required: false } // Não obrigatório
});

const Device = mongoose.model('Device', DeviceSchema);
module.exports = Device;
