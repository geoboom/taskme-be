const mongoose = require('mongoose');

const Job = require('../job/Job');
const {
  assignmentSchema,
} = require('./assignment/Assignment');
const taskVirtuals = require('./taskVirtuals');
const taskStaticsTask = require('./taskStaticsTask');
const {
  V_TASK_UNASSIGNED,
  V_TASK_PENDING_LEADER_ACCEPT,
  V_TASK_NOT_STARTED,
  V_TASK_IN_PROGRESS,
  V_TASK_PAUSED,
  V_TASK_COMPLETED,
  mapStatusLeaderToTask,
} = require('./constants/taskGraph');
const {
  userLeader,
  userValid,
  populateUsers,
} = require('./helpers/generalHelpers');
const {
  taskAssignedTosAreDistinct,
  taskLeaderCount,
} = require('./helpers/taskHelpers');
const {
  taskScoreRandomLeader,
} = require('./helpers/taskHelpers');

const TITLE_MAX = 30;
const DESC_MAX = 160;

const taskSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  deleted: {
    type: Boolean,
    default: false,
    required: true,
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    validate: {
      validator: async jobId => Job.getJob(jobId),
      message: 'Parent job does not exist.',
    },
    required: 'Parent job required.',
  },
  title: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length <= TITLE_MAX,
        message: `Task title cannot have more than ${TITLE_MAX} characters.`,
      },
    ],
    required: 'Task title required.',
  },
  description: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length <= DESC_MAX,
        message: `Task description cannot have more than ${DESC_MAX} characters.`,
      },
    ],
  },
  type: {
    type: String,
    enum: ['Inspection', 'Survey'],
    required: 'Task type required.',
  },
  status: {
    type: String,
    enum: [
      V_TASK_UNASSIGNED,
      V_TASK_PENDING_LEADER_ACCEPT,
      V_TASK_NOT_STARTED,
      V_TASK_IN_PROGRESS,
      V_TASK_PAUSED,
      V_TASK_COMPLETED,
    ],
    default: V_TASK_UNASSIGNED,
    required: 'Task status required.',
  },
  dueOn: {
    type: Date,
    required: 'Task due date required.',
    // TODO: validator -- ensure that date is >= current date
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator(userId) {
        return (userLeader(userId, this.assignments) || userValid(userId, 'admin'));
      },
      message: 'User not authorized to complete task.',
    },
    required() { return this.status === V_TASK_COMPLETED; },
  },
  assignments: {
    type: [{
      type: assignmentSchema,
    }],
    validate: [
      {
        validator: assignments => taskLeaderCount(assignments) <= 1,
        message: 'Task must have not more than one leader.',
      },
      {
        validator: taskAssignedTosAreDistinct,
        message: 'Task cannot be assigned to the same person more than once.',
      },
    ],
  },
  checklist: {
    type: [{
      questionNumber: Number,
      question: String,
      done: {
        type: Boolean,
        default: false,
      },
    }],
  },
  attachments: {
    type: [{
      originalname: String,
      mimetype: String,
      destination: String,
      filename: String,
      path: String,
    }],
  },
}, {
  timestamps: true,
});

taskVirtuals(taskSchema);
taskStaticsTask(taskSchema);

taskSchema.pre('validate', async (next) => {
  await populateUsers();
  next();
});
taskSchema.pre('save', function (next) {
  const {
    activeMembers, isCompleted, leaderCount,
  } = this;
  if (isCompleted) {
    return next();
  }

  if (activeMembers.length === 0) {
    this.status = V_TASK_UNASSIGNED;
    return next();
  }

  if (leaderCount === 0) {
    // assign new leader with algorithm
    const newLeader = taskScoreRandomLeader(this.assignments);
    this.status = mapStatusLeaderToTask[newLeader.status];
    return next();
  }

  this.status = mapStatusLeaderToTask[this.leaderStatus];
  return next();
});

module.exports = mongoose.model('Task', taskSchema);
