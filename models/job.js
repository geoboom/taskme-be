const mongoose = require('mongoose');

const ApiError = require('../helpers/apiError');
const JobCategory = require('./jobCategory');
const JobComponent = require('./jobComponent');

let validCategories = [];
let validComponents = [];

const categoryValidator = category => validCategories.includes(category);
const componentValidator = component => validComponents.includes(component);

const TITLE_MAXLEN = 80;
const DESC_MAXLEN = 200;

const jobSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  // TODO: add created by
  title: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length < TITLE_MAXLEN,
        message: `Job title cannot have more than ${TITLE_MAXLEN} characters.`,
      },
    ],
    required: 'Job title required.',
  },
  description: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length < DESC_MAXLEN,
        message: `Job description cannot have more than ${DESC_MAXLEN} characters.`,
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
jobSchema.statics.getAllJobs = async function () {
  const jobs = await this.findOne({}).exec();
  return jobs;
};

jobSchema.statics.addJob = async function (newJob) {
  const {
    title,
    description,
    category,
    component,
  } = newJob;

  const job = new this({
    _id: new mongoose.Types.ObjectId(),
    title,
    description,
    category,
    component,
  });

  return job.save();
};

jobSchema.statics.editJob = async function (newJob) {
  const {
    _id,
    title,
    description,
    category,
    component,
  } = newJob;
  const job = await this.findOne({ _id }).exec();
  if (!job) throw new ApiError('Job not found.', 404);

  job.title = title;
  job.description = description;
  job.category = category;
  job.component = component;

  return job.save();
};

// TODO: soft deleted associated tasks
jobSchema.statics.removeJob = async function (_id) {
  const removedJob = await this.deleteOne({ _id }).exec();

  return removedJob;
};

module.exports = mongoose.model('Job', jobSchema);
