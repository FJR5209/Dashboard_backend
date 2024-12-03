const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tempLimit: { type: Number, required: true },
  humidityLimit: { type: Number, required: true },
  alertType: { type: String, enum: ['email', 'sms'], required: true },
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
