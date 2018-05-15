const mongoose = require('mongoose');

const ApiError = require('../helpers/apiError');
const Job = require('./job');
const User = require('./user');

let allUsers = [];
const assignmentStatuses = {
  'Pending Accept': {
    incoming: [
      'Assigned',
    ],
    outgoing: [
      'Accept',
    ],
  },
  'Not Started': {
    incoming: [
      'Accept',
    ],
    outgoing: [
      'Start',
      'Drop',
      'Removed',
    ],
  },
  'In Progress': {
    incoming: [
      'Start',
      'Resume',
    ],
    outgoing: [
      'Pause',
      'Complete',
      'Mark Complete',
      'Drop',
      'Removed',
    ],
  },
  Paused: {
    incoming: [
      'Pause',
    ],
    outgoing: [
      'Resume',
      'Complete',
      'Drop',
      'Removed',
    ],
  },
  Completed: {
    incoming: [
      'Complete',
      'Mark Complete',
    ],
    outgoing: [
    ],
  },
  Dropped: {
    incoming: [
      'Drop',
    ],
    outgoing: [
      'Assigned',
    ],
  },
  Rejected: {
    incoming: [
      'Reject',
    ],
    outgoing: [
      'Assigned',
    ],
  },
  Removed: {
    incoming: [
      'Removed',
    ],
    outgoing: [
      'Assigned',
    ],
  },
  Uninvolved: {
    incoming: [
      'Task End',
    ],
    outgoing: [
    ],
  },
  Unaccepted: {
    incoming: [
      'Task End',
    ],
    outgoing: [
    ],
  },
};

const getUniqueActivityTypes = () => {
  const seen = {};
  const uniqueActivityTypes = [];
  let type;

  Object.keys(assignmentStatuses).forEach((key) => {
    for (let i = 0; i < assignmentStatuses[key].length; i += 1) {
      type = assignmentStatuses[key][i];
      if (!seen[type]) {
        uniqueActivityTypes.push(type);
        seen[type] = 1;
      }
    }
  });

  return uniqueActivityTypes;
};
const assignmentUniqueAssignedTo = (assignments) => {
  if (assignments.length === 0 || assignments.length === 1) {
    return true;
  }

  const seen = {};
  let assignment;

  for (let i = 0; i < assignments.length; i += 1) {
    assignment = assignments[i];
    if (seen[assignment.assignedTo]) return false;
    seen[assignment.assignedTo] = 1;
  }

  return true;
};
const assignmentOnlyOneLeader = (assignments) => {
  if (assignments.length === 0) {
    return true;
  }

  let leaderCount = 0;
  let assignment;

  for (let i = 0; i < assignments.length; i += 1) {
    assignment = assignments[i];

    if (assignment.isLeader) {
      leaderCount += 1;
    }
  }

  return leaderCount === 1;
};
const userIsTaskLeader = (userId) => {
  const { assignments } = this;
  let assignment;
  const userIdString = userId.toString();

  for (let i = 0; i < assignments.length; i += 1) {
    assignment = assignments[i];
    if (assignment.assignedTo.toString() === userIdString && assignment.isLeader) {
      return true;
    }
  }
  return false;
};
const userIsValid = (userId, group = null) => {
  let user;
  const userIdString = userId.toString();

  if (group) {
    for (let i = 0; i < allUsers.length; i += 1) {
      user = allUsers[i];
      if (user._id.toString() === userIdString && user.group === group) {
        return true;
      }
    }

    return false;
  }

  for (let i = 0; i < allUsers.length; i += 1) {
    user = allUsers[i];
    if (user._id === userIdString) {
      return true;
    }
  }

  return false;
};

const assignmentSchema = mongoose.Schema({
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
  assignedOn: {
    type: Date,
    default: Date.now(),
  },
  status: {
    type: String,
    enum: Object.keys(assignmentStatuses),
    default: 'Pending Accept',
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
        enum: getUniqueActivityTypes(),
        required: true,
      },
      ts: {
        type: Date,
        default: Date.now(),
      },
    },
  ],
});
assignmentSchema.pre('validate', async function (next) {
  allUsers = await User.find({}).exec();
  next();
});

assignmentSchema.pre('save', async () => {
  // calculate status

});

const Assignment = mongoose.model('Assignment', assignmentSchema);

const parentJobValidator = async jobId => Job.findOne({ _id: jobId }).exec();

const TITLE_MAXLEN = 80;
const DESC_MAXLEN = 200;

const taskSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    validate: {
      validator: parentJobValidator,
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
  },
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: userId => (userIsTaskLeader(userId) || userIsValid(userId, 'admin')),
      message: 'User not authorized to complete task.',
    },
    required: this.status === 'Completed',
  },
  assignments: {
    type: [{
      _id: false,
      type: assignmentSchema,
    }],
    validate: [
      {
        validator: assignmentOnlyOneLeader,
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


const leaderStatusToTaskStatus = {
  'Rejected': 'Unassigned',
  'Pending Accept': 'Pending Leader Accept',
  'Not Started': 'Not Started',
  'In Progress': 'In Progress',
  'Paused': 'Paused',
  'Completed': 'Completed',
};

taskSchema.pre('save', function (next) {
  // compute task status
  if (this.assignments.length > 0 && !this.isCompleted) {
    this.status = leaderStatusToTaskStatus[this.leaderStatus];
  }

  next();
});

taskSchema.virtual('leaderStatus').get(function () {
  let assignment;
  for (let i = 0; i < this.assignments.length; i += 1) {
    assignment = this.assignments[i];
    if (assignment.isLeader) {
      return assignment.status;
    }
  }

  throw new ApiError('No task leader!');
});
taskSchema.virtual('isCompleted').get(function () {
  return this.status === 'Completed';
});

taskSchema.statics.createTask = async function (task) {
  const {
    jobId,
    title,
    description,
    type,
    dueOn,
    assignments,
  } = task;

  const newTask = new this({
    _id: new mongoose.Types.ObjectId(),
    jobId,
    title,
    description,
    type,
    dueOn,
    assignments,
  });

  return newTask.save();
};

// TODO: implement document locking during 'find and save' to prevent race update condition
taskSchema.statics.createAssignment = function (assignment) {
  const {
    assignedTo,
    assignedBy,
    isLeader,
  } = assignment;

  return new Assignment({ assignedTo, assignedBy, isLeader });
};
taskSchema.statics.addAssignment = async function (_id, assignment) {
  const task = await this.findOne({ _id }).exec();
  if (task.isCompleted) throw new ApiError('Cannot add assignment to completed task');

  task.assignments.push(assignment);

  return task.save();
};

const Task = mongoose.model('Task', taskSchema);
module.exports = {
  Task,
  Assignment,
};
