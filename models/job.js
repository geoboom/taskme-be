const mongoose = require('mongoose');

const validCategories = [];
const validComponents = [];

const categoryValidator = (category) => {
  return validCategories.includes(category);
};

const componentValidator = (component) => {
  return validComponents.includes(component);
};

const jobSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  category: {
    type: String,
    validate: {
      validator: categoryValidator,
      message: 'Invalid category',
    },
  },
  component: {
    type: String,
    validate: {
      validator: componentValidator,
      message: 'Invalid component',
    },
  },
});

jobSchema.pre('save', (next) => {

});