const mongoose = require('mongoose');

const { assignmentStatuses } = require('./assignmentStatuses');
const {
  activityValid,
  getActiveParticipants,
  getLeaderCount,
  taskEndAll,
} = require('./helperFunctions');
const ApiError = require('../../../helpers/apiError');

module.exports = function (taskSchemaParam) {
  const taskSchema = taskSchemaParam;

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

  taskSchema.statics.getAllTasks = async function () {
    const tasks = await this.find({ softDel: false }).exec();

    return tasks;
  };
  taskSchema.statics.getAssignedTasks = async function (userId) {
    const tasks = await this.find({ 'assignments.assignedTo': userId }).exec();
    return tasks;
  };
  taskSchema.statics.addTask = async function (task) {
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
  taskSchema.statics.editTask = async function (newTask) {
    const {
      _id,
      title,
      description,
    } = newTask;
    const task = await this.findOne({ _id }).exec();
    if (!task) throw new ApiError('Task not found.', 404);

    task.title = title;
    task.description = description;

    return task.save();
  };
  // TODO: implement document locking during 'find and save' to prevent race
  // update condition
  taskSchema.statics.removeTask = async function ({ _id }) {
    return this.deleteOne({ _id }).exec();
    // const task = await this.findOne({ _id }).exec();

    // task.softDel = true;
    // return task.save();
  };
  taskSchema.statics.adminCompleteTask = async function ({ _id }, userId) {
    const task = await this.findOne({ _id }).exec();
    if (!task) throw new ApiError('Task not found.', 404);
    if (task.isCompleted) throw new ApiError('Task already complete.');

    taskEndAll(task);
    task.status = 'Completed';
    task.completedBy = userId;

    return task.save();
  };
  taskSchema.statics.addAssignment = async function (taskId, assignment) {
    const task = await this.findOne({ _id: taskId }).exec();
    if (!task) throw new ApiError('Task not found.', 404);
    if (task.isCompleted) throw new ApiError('Cannot add assignment to completed task.');

    // check if user has already been assigned task and is softdeleted
    const existingAssignment = task.assignments.find(x => x.assignedTo.toString() === assignment.assignedTo.toString() && x.softDel);
    if (existingAssignment && assignmentStatuses[existingAssignment.status].outgoing.includes('Assigned')) {
      existingAssignment.assignedBy = assignment.assignedBy;
      existingAssignment.assignedOn = assignment.assignedOn;
      existingAssignment.activityLog.push({ activity: 'Assigned' });
      return task.save();
    }

    assignment.activityLog.push({ activity: 'Assigned' });
    task.assignments.push(assignment);
    return task.save();
  };
  taskSchema.statics.removeAssignment = async function (taskId, userId) {
    const task = await this.findOne({ _id: taskId }).exec();
    if (!task) throw new ApiError('Task not found.', 404);
    if (task.isCompleted) throw new ApiError('Cannot update assignments of completed task.');

    const assignment = task.assignments.find(x => x.assignedTo.toString() === userId.toString());
    if (!assignment) throw new ApiError('Task not assigned to user.');

    if (assignmentStatuses[assignment.status].outgoing.includes('Removed')) {
      assignment.activityLog.push({ activity: 'Removed' });
      return task.save();
    }

    throw new ApiError('Activity not permitted.');
  };
  taskSchema.statics.promoteAssignment = async function (taskId, userId) {
    const task = await this.findOne({ _id: taskId }).exec();
    if (!task) throw new ApiError('Task not found.', 404);
    if (task.isCompleted) throw new ApiError('Cannot update assignments of completed task.');

    const assignment = task.assignments.find(x => x.assignedTo.toString() === userId.toString());
    if (!assignment) throw new ApiError('Task not assigned to user.');

    if (assignment.isLeader) throw new ApiError('User is already leader.');

    const oldLeader = task.assignments.find(x => x.isLeader);

    oldLeader.isLeader = false;
    oldLeader.activityLog.push({ activity: 'Demoted from Leader' });
    assignment.isLeader = true;
    assignment.activityLog.push({ activity: 'Promoted to Leader' });

    return task.save();
  };
  taskSchema.statics.assignmentActivity = async function (taskId, userId, activity) {
    const task = await this.findOne({ _id: taskId }).exec();
    if (!task) throw new ApiError('Task not found.', 404);
    if (task.isCompleted) throw new ApiError('Cannot update assignments of completed task.');

    const assignment = task.assignments.find(x => x.assignedTo.toString() === userId.toString());
    if (!assignment) throw new ApiError('Task not assigned to user.');

    if (activityValid(assignment.status, activity, assignment.isLeader, task.leaderStatus)) {
      // check if current date equals task dueOn?
      assignment.activityLog.push({ activity });
      if (activity === 'Mark Complete') {
        taskEndAll(task);
        task.completedBy = userId;
      }
      return task.save();
    }

    throw new ApiError('Activity not permitted.');
  };
};
