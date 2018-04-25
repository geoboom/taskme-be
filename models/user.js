const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: {
    type: String,
    required: 'Username is required.',
    unique: true,
  },
  password: {
    type: String,
    required: 'Password is required.',
  },
});

module.exports = mongoose.model('User', userSchema);
