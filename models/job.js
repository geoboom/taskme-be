const mongoose = require('mongoose');
const validator = require('validator');

const JobCategory = require('./jobCategory');
const JobComponent = require('./jobComponent');

let validCategories;
let validComponents;

const categoryValidator = category => validCategories.includes(category);

const componentValidator = component => validComponents.includes(component);

const jobSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  category: {
    type: String,
    validate: {
      validator: categoryValidator,
      message: 'Invalid category.',
    },
    required: 'Category required.',
  },
  component: {
    type: String,
    validate: {
      validator: componentValidator,
      message: 'Invalid component.',
    },
    required: 'Component required.',
  },
  title: {
    type: String,
    validate: {
      validator: v => !validator.isLength(v, { min: 1, max: 100 }) && validator.isAscii(v),
      message: 'Invalid title.',
    },
    required: 'Title required.',
  },
  description: {
    type: String,
    validate: {
      validator: v => !validator.isLength(v, { min: 0, max: 200 }) && validator.isAscii(v),
      message: 'Invalid description.',
    },
  },
  estStartDate: {
    type: Date,
  },
  estEndDate: {
    type: Date,
  },
});

jobSchema.pre('validate', async (next) => {
  const result = await Promise.all([
    JobComponent.find({}),
    JobCategory.find({}),
  ]);

  validComponents = result[1].map(o => o.component);
  validCategories = result[2].map(o => o.category);
});
