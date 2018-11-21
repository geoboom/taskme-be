const mongoose = require('mongoose');

const JobCategory = require('./JobCategory');
const JobComponent = require('./JobComponent');

let validCategories = [];
let validComponents = [];

const categoryValidator = category => validCategories.includes(category);
const componentValidator = component => validComponents.includes(component);

const TITLE_MAX = 45;
const DESC_MAX = 160;

const jobSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  // TODO: add created by
  title: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length <= TITLE_MAX,
        message: `Job title cannot have more than ${TITLE_MAX} characters.`,
      },
    ],
    required: 'Job title required.',
  },
  description: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length <= DESC_MAX,
        message: `Job description cannot have more than ${DESC_MAX} characters.`,
      },
    ],
  },
  category: {
    type: String,
    validate: {
      validator: categoryValidator,
      message: 'Category does not exist.',
    },
    required: 'Job category required.',
  },
  component: {
    type: String,
    validate: {
      validator: componentValidator,
      message: 'Component does not exist.',
    },
    enum: validComponents,
    required: 'Job component required.',
  },
  estStart: {
    type: Date,
  },
  estEnd: {
    type: Date,
  },
}, {
  timestamps: true,
});

jobSchema.pre('validate', async (next) => {
  const result = await Promise.all([
    JobComponent.find({}).exec(),
    JobCategory.find({}).exec(),
  ]);

  validComponents = result[0].map(o => o.component);
  validCategories = result[1].map(o => o.category);

  next();
});

module.exports = jobSchema;
