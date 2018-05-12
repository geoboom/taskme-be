const mongoose = require('mongoose');

const jobCategorySchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  category: {
    type: String,
    validate: {
      validator: v => /^[a-z0-9_-]{6,15}$/.test(v),
      message: '{VALUE} is not a valid job category.',
    },
    required: 'Category is required.',
    unique: true,
  },
});
