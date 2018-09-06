/* eslint-disable no-plusplus */
const {
  taskLeaderCount,
  taskGetActiveMembers,
} = require('./helpers/taskHelpers');

module.exports = function (taskSchema) {
  taskSchema.virtual('activeMembers').get(function () {
    return taskGetActiveMembers(this.assignments);
  });
  taskSchema.virtual('leaderCount').get(function () {
    return taskLeaderCount(this.assignments);
  });
  taskSchema.virtual('leaderStatus').get(function () {
    const { assignments } = this;
    let assignment;
    for (let i = 0; i < assignments.length; ++i) {
      assignment = assignments[i];
      if (assignment.isLeader) {
        return assignment.status;
      }
    }
    return null;
  });
  taskSchema.virtual('isCompleted').get(function () {
    return this.status === 'Completed';
  });
};
