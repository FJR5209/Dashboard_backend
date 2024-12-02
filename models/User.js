const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
    },
    role:{
      type: String,
      required: false,
      unique: false
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    tempLimit: {
      type: Number,
      required: true
    },
    humidityLimit: {
      type: Number,
      required: true
    }
  });
  

const User = mongoose.model('User', userSchema);

module.exports = User;
