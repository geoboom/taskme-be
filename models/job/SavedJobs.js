const mongoose = require('mongoose');

const ApiError = require('../../helpers/apiError');
const Job = require('./Job');
const Task = require('../task/Task');

const TITLE_MAX = 45;

const savedJobSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  title: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length <= TITLE_MAX,
        message: `Title of job save cannot have more than ${TITLE_MAX} characters.`,
      },
    ],
    required: 'Title of job save required.',
  },
  job: {
    type: Map,
    of: String,
  },
  tasks: [{
    type: Map,
    of: String,
  }],
  noTasks: Number,
});

savedJobSchema.statics.getSavedJob = async function (_id) {
  const savedJob = await this.findOne({ _id }).exec();
  const { job: rawJob } = savedJob;
  const tasks = savedJob.tasks.map((task) => ({
    title: task.get('title'),
    description: task.get('description'),
    type: task.get('type'),
    attachments: task.get('attachments'),
    assignments: [],
    checklist: task.get('checklist').map(item => ({ ...item, done: false })),
  }));
  return ({
    ...savedJob,
    job: {
      title: rawJob.get('title'),
      description: rawJob.get('description'),
      category: rawJob.get('category'),
      component: rawJob.get('component'),
    },
    tasks,
  });
};

savedJobSchema.statics.getAllSavedJobs = async function () {
  return this.find({}).exec();
};

savedJobSchema.statics.saveJob = async function ({
  title,
  jobId,
  savedJobId,
}) {
  const rawJob = await Job.getJob(jobId);
  if (!rawJob) throw new ApiError('Job not found.', 404);
  const tasks = (await Task.find({ jobId, deleted: false }).exec() || []).map(({
    title: taskTitle,
    description,
    type,
    attachments,
    checklist,
  }) => ({
    title: taskTitle,
    description,
    type,
    attachments,
    assignments: [],
    checklist,
  }));
  let savedJob;

  const job = {
    title: rawJob.title,
    description: rawJob.description,
    category: rawJob.category,
    component: rawJob.component,
  };

  if (savedJobId) {
    savedJob = await this.findOne({ _id: savedJobId }).exec();
    if (!savedJob) throw new ApiError('Saved job not found.', 404);
    savedJob.title = title;
    savedJob.job = job;
    savedJob.tasks = tasks;
    savedJob.noTasks = tasks.length;
  } else {
    savedJob = new this({
      _id: new mongoose.Types.ObjectId(),
      title,
      job,
      tasks,
      noTasks: tasks.length,
    });
  }

  return savedJob.save();
};

savedJobSchema.statics.removeSavedJob = async function (_id) {
  return this.deleteOne({ _id }).exec();
};

module.exports = mongoose.model('SavedJob', savedJobSchema);

