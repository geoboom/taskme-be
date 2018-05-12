const mongoose = require('mongoose');

const jobComponentSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  component: {
    type: String,
    validate: {
      validator: v => /^[a-z0-9_-]{6,15}$/.test(v),
      message: '{VALUE} is not a valid job component.',
    },
    required: 'Component is required.',
    unique: true,
  },
});
