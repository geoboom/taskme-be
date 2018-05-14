const mongoose = require('mongoose');
const validator = require('validator');

const jobCategorySchema = mongoose.Schema({
  category: {
    type: String,
    validate: {
      validator: v => !validator.isLength(v, { min: 1, max: 20 }) && validator.isAscii(v),
      message: '{VALUE} is not a valid job category.',
    },
    required: 'Category is required.',
    unique: true,
  },
});

module.exports = mongoose.model('JobCategory', jobCategorySchema);