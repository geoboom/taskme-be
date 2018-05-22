const mongoose = require('mongoose');

const Job = require('./job');
const User = require('./user');
const {
  assignmentStatuses,
  softDelStatuses,
} = require('./helpers/task/assignmentStatuses');
const {
  getUniqueActivityTypes,
  assignmentUniqueAssignedTo,
  assignmentMaxOneLeader,
  userIsTaskLeader,
  userIsValid,
  scoreBasedRandomLeader,
} = require('./helpers/task/helperFunctions');
const taskSchemaStatics = require('./helpers/task/taskSchemaStatics');

let allUsers = [];

const assignmentSchema = mongoose.Schema({
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: userId => userIsValid(userId, allUsers, 'worker'),
      message: 'Invalid assignedTo user.',
    },
    required: 'Assignment assignedTo required.',
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: userId => userIsValid(userId, allUsers, 'admin'),
      message: 'Invalid assignedBy user.',
    },
    required: 'Assignment assignedBy required.',
  },
  assignedOn: {
    type: Date,
    default: Date.now(),
  },
  softDel: {
    type: Boolean,
    default: false,
    required: true,
  },
  status: {
    type: String,
    enum: Object.keys(assignmentStatuses),
    default: 'Pending Accept',
    required: 'Assignment status required.',
  },
  isLeader: {
    type: Boolean,
    default: false,
    required: 'Assignment isLeader required.',
  },
  activityLog: [
    {
      _id: false,
      activity: {
        type: String,
        // enum: getUniqueActivityTypes(),
        required: true,
      },
      ts: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
}, { _id: false });

assignmentSchema.pre('save', async function (next) {
  // calculate new status from old status and latest activity
  const assignmentStatusesKeys = Object.keys(assignmentStatuses);
  const activityLogLength = this.activityLog.length;

  let assignmentStatusObj;
  let assignmentStatusName;
  for (let i = 0; i < assignmentStatusesKeys.length; i += 1) {
    assignmentStatusName = assignmentStatusesKeys[i];
    assignmentStatusObj = assignmentStatuses[assignmentStatusName];
    if (assignmentStatusObj.incoming.includes(this.activityLog[activityLogLength - 1].activity)) {
      this.status = assignmentStatusName;
      // determine if new status warrants a soft delete
      this.softDel = softDelStatuses.includes(assignmentStatusName);
      if (this.isLeader) {
        // should be removed from leader if soft deleted
        this.isLeader = !this.softDel;
      }
    }
  }

  next();
});

const TITLE_MAXLEN = 80;
const DESC_MAXLEN = 200;

const taskSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    validate: {
      validator: async jobId => Job.findOne({ _id: jobId }).exec(),
      message: 'Parent job does not exist.',
    },
    required: 'Parent job required.',
  },
  title: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length < TITLE_MAXLEN,
        message: `Task title cannot have more than ${TITLE_MAXLEN} characters.`,
      },
    ],
    required: 'Task title required.',
  },
  description: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length < DESC_MAXLEN,
        message: `Task description cannot have more than ${DESC_MAXLEN} characters.`,
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
    enum: ['Unassigned', 'Pending Leader Accept', 'Not Started', 'In Progress', 'Paused', 'Completed'],
    default: 'Unassigned',
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
        return (userIsTaskLeader(userId, this.assignments) || userIsValid(userId, allUsers, 'admin'));
      },
      message: 'User not authorized to complete task.',
    },
    required() { return this.status === 'Completed'; },
  },
  assignments: {
    type: [{
      type: assignmentSchema,
    }],
    validate: [
      {
        validator: assignmentMaxOneLeader,
        message: 'Task must have one leader only.',
      },
      {
        validator: assignmentUniqueAssignedTo,
        message: 'Task cannot be assigned to the same person more than once.',
      },
    ],
  },
}, {
  timestamps: true,
});

taskSchemaStatics(taskSchema);

const leaderStatusToTaskStatus = {
  'Pending Accept': 'Pending Leader Accept',
  'Not Started': 'Not Started',
  'In Progress': 'In Progress',
  Paused: 'Paused',
  Completed: 'Completed',
};
taskSchema.pre('validate', async (next) => {
  allUsers = await User.find({}).exec();
  next();
});
taskSchema.pre('save', function (next) {
  const {
    activeParticipants, isCompleted, leaderCount,
  } = this;
  if (isCompleted) {
    return next();
  }

  if (activeParticipants.length === 0) {
    this.status = 'Unassigned';
    return next();
  }

  if (!leaderCount) {
    // assign new leader with algorithm
    const newLeader = scoreBasedRandomLeader(this.assignments);
    this.status = leaderStatusToTaskStatus[newLeader.status];
    return next();
  }

  this.status = leaderStatusToTaskStatus[this.leaderStatus];
  return next();
});

exports.Assignment = mongoose.model('Assignment', assignmentSchema);
exports.Task = mongoose.model('Task', taskSchema);
