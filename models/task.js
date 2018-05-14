const mongoose = require('mongoose');
const validator = require('validator');

const Job = require('./job');
const User = require('./user');

let allUsers = [];

const assignmentValidator = async (assignments) => {
  let leaderCount = 0;
  let assignment;

  for (let i = 0; i < assignments.count; i += 1) {
    assignment = assignments[i];

    if (assignment.isLeader) {
      leaderCount += 1;
    }
  }

  return leaderCount === 1;
};
const userIsLeader = async (userId) => {
  const assignments = this.assignments;
  let assignment;

  for (let i = 0; i < assignments.length; i += 1) {
    assignment = assignments[i];
    if (assignment.assignedTo === userId && assignment.isLeader) {
      return true;
    }
  }
  return false;
};
const userIsValid = async (userId, group = null) => {
  let user;

  if (group) {
    for (let i = 0; i < allUsers.length; i += 1) {
      user = allUsers[i];
      if (user._id === userId && user.group === group) {
        return true;
      }
    }

    return false;
  }

  for (let i = 0; i < allUsers.length; i += 1) {
    user = allUsers[i];
    if (user._id === userId) {
      return true;
    }
  }

  return false;
};

const assignmentSchema = mongoose.Schema(
  {
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: userId => userIsValid(userId, 'worker'),
        message: 'Invalid assignedTo user.',
      },
      required: 'Assignment assignedTo required.',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      validate: {
        validator: userId => userIsValid(userId, 'admin'),
        message: 'Invalid assignedBy user.',
      },
      required: 'Assignment assignedBy required.',
    },
    status: {
      type: String,
      enum: ['Pending Accept', 'Not Started', 'In Progress', 'Paused', 'Completed', 'Dropped', 'Rejected', 'Removed'],
      required: 'Assignment status required.',
    },
    isLeader: {
      type: Boolean,
      required: 'Assignment isLeader required.',
    },
    activity: [
      {
        event: {
          type: String,
          enum: ['Accept', 'Reject', 'Drop', 'Removed', 'Start', 'Pause', 'Resume', 'Complete', 'Mark Complete'],
        },
        ts: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
  },
);


const parentJobValidator = async (jobId) => {
  return Job.findOne({ _id: jobId }).exec();
};

const taskSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    validate: {
      validator: parentJobValidator,
      message: 'Parent job not found.',
    },
    required: 'Parent job required.',
  },
  title: {
    type: String,
    validate: [
      {
        validator: v => !validator.isLength(v, { min: 1, max: 100 }),
        message: 'Task title cannot be blank.',
      },
      {
        validator: v => validator.isAscii(v),
        message: 'Invalid task title.',
      },
    ],
    required: 'Task title required.',
  },
  description: {
    type: String,
    validate: {
      validator: v => !validator.isLength(v, { min: 0, max: 200 }) && validator.isAscii(v),
      message: 'Invalid task description.',
    },
    required: 'Task description required.',
  },
  type: {
    type: String,
    enum: ['Inspection', 'Survey'],
    required: 'Task type required.',
  },
  status: {
    type: String,
    enum: ['Unassigned', 'Pending Leader Accept', 'Not Started', 'In Progress', 'Paused', 'Completed'],
    required: 'Task status required.',
  },
  dueOn: {
    type: Date,
    required: 'Task due date required.',
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: userId => (userIsLeader(userId) || userIsValid(userId, 'admin')),
      message: 'User not authorized to complete task.',
    },
    required: this.status === 'Completed',
  },
  assignments: {
    type: [assignmentSchema],
    validate: {
      validator: assignmentValidator,
      message: 'Invalid assignments.',
    },
  },
}, {
  timestamps: true,
});

taskSchema.pre('validate', async (next) => {
  allUsers = await User.find({});

  next();
});

module.exports = mongoose.model('Task', taskSchema);