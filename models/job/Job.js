const mongoose = require('mongoose');

const ApiError = require('../../helpers/apiError');
const jobSchema = require('./jobSchema');

jobSchema.statics.getAllJobs = async function () {
  return this.find({}).exec();
};

jobSchema.statics.getJob = async function (_id) {
  const job = await this.findOne({ _id }).exec();
  return job;
};

jobSchema.statics.addJob = async function ({
  title,
  description,
  category,
  component,
}) {
  const job = new this({
    _id: new mongoose.Types.ObjectId(),
    title,
    description,
    category,
    component,
  });

  return job.save();
};

jobSchema.statics.editJob = async function ({
  _id,
  title,
  description,
  category,
  component,
}) {
  const job = await this.findOne({ _id }).exec();
  if (!job) throw new ApiError('Job not found.', 404);

  job.title = title;
  job.description = description;
  job.category = category;
  job.component = component;

  return job.save();
};

jobSchema.statics.removeJob = async function (jobId) {
// eslint-disable-next-line global-require
  const Task = require('../task/Task');
  await Task.updateMany({ jobId }, { deleted: true }).exec();
  return this.deleteOne({ _id: jobId }).exec();
};

module.exports = mongoose.model('Job', jobSchema);
