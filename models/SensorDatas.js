const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  deviceId: { type: String, required: true, unique: true, },
  temperatura: { type: Number, required: true },
  umidade: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model('SensorData', sensorDataSchema);
module.exports = SensorData;
