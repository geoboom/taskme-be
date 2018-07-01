const mongoose = require('mongoose');

const {
  vertexSet,
  V_PENDING_ACCEPT,
} = require('../constants/assignmentGraph');
const {
  userValid,
} = require('../helpers/generalHelpers');

const assignmentSchema = mongoose.Schema({
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: userId => userValid(userId, 'standard'),
      message: 'Invalid assignedTo user.',
    },
    required: 'Assignment assignedTo required.',
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: userId => userValid(userId, 'admin'),
      message: 'Invalid assignedBy user.',
    },
    required: 'Assignment assignedBy required.',
  },
  assignedOn: {
    type: Date,
    default: Date.now(),
  },
  deleted: {
    type: Boolean,
    default: false,
    required: true,
  },
  status: {
    type: String,
    enum: Object.keys(vertexSet),
    default: V_PENDING_ACCEPT,
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
  // determine new isLeader and deleted states for assignment given its status
  const vStatus = vertexSet[this.status];
  this.deleted = vStatus.deleteFlag;

  if (this.isLeader) {
    this.isLeader = !this.deleted;
  }

  next();
});

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = {
  Assignment,
  assignmentSchema,
};
