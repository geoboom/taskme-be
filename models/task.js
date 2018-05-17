const mongoose = require('mongoose');

const ApiError = require('../helpers/apiError');
const Job = require('./job');
const User = require('./user');

let allUsers = [];
const assignmentStatuses = {
  'Pending Accept': {
    scores: {
      s1: 1,
      s2: 1,
    },
    taskEndActivity: 'No Response',
    incoming: [
      'Assigned',
    ],
    outgoing: [
      'Accept',
    ],
  },
  'Not Started': {
    scores: {
      s1: 1,
      s2: 2,
    },
    taskEndActivity: 'No Participation',
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
    scores: {
      s1: 2,
      s2: 4,
    },
    taskEndActivity: 'Task End',
    incoming: [
      'Start',
      'Resume',
    ],
    outgoing: [
      'Pause',
      'Task End',
      'Mark Complete',
      'Drop',
      'Removed',
    ],
  },
  Paused: {
    scores: {
      s1: 2,
      s2: 3,
    },
    taskEndActivity: 'Task End',
    incoming: [
      'Pause',
    ],
    outgoing: [
      'Resume',
      'Task End',
      'Drop',
      'Removed',
    ],
  },
  Completed: {
    incoming: [
      'Task End',
      'Mark Complete',
    ],
    outgoing: [
    ],
  },
  Uninvolved: {
    incoming: [
      'No Participation',
    ],
    outgoing: [
    ],
  },
  Unaccepted: {
    incoming: [
      'No Response',
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
};

const allowedMemberActivities = [
  'Accept',
  'Start',
  'Pause',
  'Resume',
  'Drop',
];
const softDelStatuses = [
  'Uninvolved',
  'Unaccepted',
  'Dropped',
  'Rejected',
  'Removed',
];
const activityValid = (currentStatus, activity, isLeader) => {
  if (activity === 'Mark Complete') {
    // check if currentStatus permits such activity
    return (isLeader && assignmentStatuses[currentStatus].outgoing.includes(activity));
  }

  return (
    allowedMemberActivities.includes(activity)
    && assignmentStatuses[currentStatus].outgoing.includes(activity)
  );
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
const getActiveParticipants = (assignments) => {
  const activeParticipants = [];
  let assignment;
  for (let i = 0; i < assignments.length; i += 1) {
    assignment = assignments[i];
    if (!assignment.softDel) {
      activeParticipants.push(assignment);
    }
  }

  return activeParticipants;
};
const getLeaderCount = (assignments) => {
  let leaderCount = 0;
  for (let i = 0; i < assignments.length; i += 1) {
    if (assignments[i].isLeader) {
      leaderCount += 1;
    }
  }
  return leaderCount;
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
const assignmentMaxOneLeader = function (assignments) {
  if (getActiveParticipants(assignments).length === 0) {
    return true;
  }

  return getLeaderCount(assignments) <= 1;
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
    required: 'Assignment isLeader required.',
  },
  activityLog: [
    {
      activity: {
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
}, { _id: false });

// assignmentSchema.pre('validate', async (next) => {
//   allUsers = await User.find({}).exec();
//   next();
// });

assignmentSchema.pre('save', async function (next) {
  // calculate status
  const assignmentStatusesKeys = Object.keys(assignmentStatuses);
  const activityLogLength = this.activityLog.length;

  let assignmentStatus;
  for (let i = 0; i < assignmentStatusesKeys.length; i += 1) {
    assignmentStatus = assignmentStatuses[assignmentStatusesKeys[i]];
    if (assignmentStatus.incoming.includes(this.activityLog[activityLogLength - 1].activity)) {
      this.status = assignmentStatus;
      this.softDel = softDelStatuses.includes(assignmentStatus);
      if (this.isLeader) {
        this.isLeader = !this.softDel;
      }
    }
  }

  next();
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

const leaderStatusToTaskStatus = {
  'Pending Accept': 'Pending Leader Accept',
  'Not Started': 'Not Started',
  'In Progress': 'In Progress',
  Paused: 'Paused',
  Completed: 'Completed',
};

function randomIntFromInterval(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1)) + min);
}
const scoreBasedRandomLeader = (assignments) => {
  let highestObservedScore = 1;
  let highestScorers = [];

  let assignment;
  let currentScore;
  for (let i = 0; i < assignments.length; i += 1) {
    assignment = assignments[i];
    if (!assignment.softDel) {
      currentScore = assignmentStatuses[assignment.status].scores.s2;

      if (currentScore > highestObservedScore) {
        highestObservedScore = currentScore;
        highestScorers = [];
        highestScorers.push(assignment);
      }

      if (currentScore === highestObservedScore) {
        highestScorers.push(assignment);
      }
    }
  }

  // Set a random highest scorer to be leader
  const randomHighestScorer = highestScorers[randomIntFromInterval(0, highestScorers.length)];
  randomHighestScorer.isLeader = 1;
  randomHighestScorer.activityLog.push({ activity: 'Promoted to Leader' });
  return randomHighestScorer;
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
    next();
  }

  if (activeParticipants.length === 0) {
    this.status = 'Unassigned';
    next();
  }

  if (!leaderCount) {
    // assign new leader with algorithm
    const newLeader = scoreBasedRandomLeader(this.assignments);
    this.status = leaderStatusToTaskStatus[newLeader.status];
    next();
  }

  this.status = leaderStatusToTaskStatus[this.leaderStatus];
  next();
});
taskSchema.virtual('activeParticipants').get(function () {
  return getActiveParticipants(this.assignments);
});
taskSchema.virtual('leaderCount').get(function () {
  return getLeaderCount(this.assignments);
});
taskSchema.virtual('leaderStatus').get(function () {
  const { assignments } = this;
  let assignment;
  for (let i = 0; i < assignments.length; i++) {
    assignment = assignments[i];
    if (assignment.isLeader) {
      return assignment.status;
    }
  }
  throw new ApiError('Task has no leader.');
});
taskSchema.virtual('isCompleted').get(function () {
  return this.status === 'Completed';
});

// TODO: implement document locking during 'find and save' to prevent race update condition
taskSchema.statics.createAssignment = function (assignment) {
  const {
    assignedTo,
    assignedBy,
    isLeader,
  } = assignment;

  return new Assignment({ assignedTo, assignedBy, isLeader });
};
taskSchema.statics.addAssignment = async function (taskId, assignment) {
  const task = await this.findOne({ _id: taskId }).exec();
  if (task.isCompleted) throw new ApiError('Cannot add assignment to completed task.');

  assignment.activityLog.push({ activity: 'Assigned' });
  task.assignments.push(assignment);
  return task.save();
};
taskSchema.statics.createTask = async function (task) {
  const {
    jobId,
    title,
    description,
    type,
    dueOn,
  } = task;

  const newTask = new this({
    _id: new mongoose.Types.ObjectId(),
    jobId,
    title,
    description,
    type,
    dueOn,
  });

  return newTask.save();
};

// for each assignment in task.assignments, push appropriate activity to activityLog
const taskEndAll = (task) => {
  const { assignments } = task;

  let assignment;
  let taskEndActivity;
  for (let i = 0; i < assignments.length; i += 1) {
    assignment = assignments[i];
    taskEndActivity = assignmentStatuses[assignment.status].taskEndActivity;
    if (taskEndActivity) {
      assignment.activityLog.push({
        activity: taskEndActivity,
      });
    }
  }
};
taskSchema.statics.adminCompleteTask = async function (taskId) {
  const task = await this.findOne({ _id: taskId }).exec();
  if (task.isCompleted) throw new ApiError('Task already complete.');

  taskEndAll(task);
  task.status = 'Completed';

  return task.save();
};
taskSchema.statics.addWorkerActivity = async function (taskId, userId, activity) {
  const task = await this.findOne({ _id: taskId }).exec();
  if (!task) throw new ApiError('Task not found.', 404);
  if (task.isCompleted) throw new ApiError('Cannot update assignments of completed task.');

  const assignment = task.assignments.find(x => x.assignedTo.toString() === userId.toString());
  if (!assignment) throw new ApiError('Task not assigned to user.');

  if (activityValid(assignment.status, activity, assignment.isLeader)) {
    assignment.activityLog.push({ activity });
    if (activity === 'Mark Complete') {
      taskEndAll(task);
    }
    return task.save();
  }

  throw new ApiError('Activity not permitted.');
};

module.exports = mongoose.model('Task', taskSchema);
