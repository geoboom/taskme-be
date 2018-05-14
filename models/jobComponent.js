const mongoose = require('mongoose');
const validator = require('validator');

const jobComponentSchema = mongoose.Schema({
  component: {
    type: String,
    validate: {
      validator: v => !validator.isLength(v, { min: 1, max: 20 }) && validator.isAscii(v),
      message: '{VALUE} is not a valid job component.',
    },
    required: 'Component is required.',
    unique: true,
  },
});

module.exports = mongoose.model('JobComponent', jobComponentSchema);
