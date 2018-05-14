const mongoose = require('mongoose');

const JobCategory = require('./jobCategory');
const JobComponent = require('./jobComponent');

let validCategories = [];
let validComponents = [];

// const categoryValidator = category => validCategories.includes(category);
// validate: {
//   validator: categoryValidator,
//     message: 'Invalid category.',
// },
// const componentValidator = component => validComponents.includes(component);
// validate: {
//   validator: componentValidator,
//     message: 'Invalid component.',
// },

const jobSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length > 0,
        message: 'Job title cannot be blank.',
      },
      {
        validator: v => v.trim().length < 100,
        message: 'Job title cannot have more than 100 characters.',
      },
    ],
    required: 'Job title required.',
  },
  description: {
    type: String,
    trim: true,
    validate: {
      validate: [
        {
          validator: v => v.trim().length < 200,
          message: 'Job description cannot have more than 200 characters.',
        },
      ],
    },
  },
  category: {
    type: String,
    enum: validCategories,
    required: 'Job category required.',
  },
  component: {
    type: String,
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
    JobComponent.find({}),
    JobCategory.find({}),
  ]);

  validComponents = result[1].map(o => o.component);
  validCategories = result[2].map(o => o.category);

  next();
});

jobSchema.statics.createJob = async (title, description, category, component) => {
  const job = new this({
    _id: new mongoose.Types.ObjectId(),
    title,
    description,
    category,
    component,
  });

  return job.save();
};

module.exports = mongoose.model('Job', jobSchema);
