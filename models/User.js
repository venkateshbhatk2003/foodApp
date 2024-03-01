const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  googleId: String,
  facebookId: String,
  role: { type: String, enum: ['admin', 'superuser', 'user'], default: 'user' }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
