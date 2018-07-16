/* eslint-disable no-param-reassign */
const mongoose = require('mongoose');

const {
  edgeList,
  vertexSet,
  E_MARK_COMPLETE,
  E_REMOVED,
  E_ASSIGNED,
} = require('./constants/assignmentGraph');
const {
  V_TASK_COMPLETED,
} = require('./constants/taskGraph');
const {
  taskEndAll,
  validateAndReturnTask,
} = require('./helpers/taskHelpers');
const { getNextStatus } = require('./helpers/assignmentHelpers');
const ApiError = require('../../helpers/apiError');

module.exports = function (taskSchemaParam) {
  const taskSchema = taskSchemaParam;
  taskSchema.statics.getAllTasks = async function () {
    return this.find({ deleted: false }).exec();
  };
  taskSchema.statics.getAssignedTasks = async function (userId) {
    return this.find().and([
      {
        deleted: false,
      },
      {
        'assignments.assignedTo': userId,
      },
      {
        'assignments.$.deleted': false,
      },
    ]).exec();
  };
  taskSchema.statics.addTask = async function ({
    jobId, title, description, type, dueOn,
  }) {
    const task = new this({
      _id: new mongoose.Types.ObjectId(),
      jobId,
      title,
      description,
      type,
      dueOn,
    });

    return task.save();
  };
  taskSchema.statics.editTask = async function ({ _id, title, description }) {
    const task = await validateAndReturnTask(_id);

    task.title = title;
    task.description = description;

    return task.save();
  };
  // TODO: implement document locking during 'find and save' to prevent race
  // update condition
  taskSchema.statics.removeTask = async function (_id) {
    const task = await this.findOne({ _id }).exec();

    task.deleted = true;
    return task.save();
  };
  taskSchema.statics.adminCompleteTask = async function (taskId, userId) {
    const task = validateAndReturnTask(taskId);

    taskEndAll(task);
    task.status = V_TASK_COMPLETED;
    task.completedBy = userId;

    return task.save();
  };
  taskSchema.statics.addAssignment = async function (taskId, assignment) {
    const task = await validateAndReturnTask(taskId);
    // check if user has already been assigned task
    const existing = task.assignments.find(a =>
      a.assignedTo.toString() === assignment.assignedTo.toString());
    if (existing) {
      if (existing.deleted) {
        const edge = edgeList.find(e =>
          e.from === existing.status && e.name === E_ASSIGNED);
        if (edge) {
          existing.status = vertexSet[edge.to].name;
          existing.assignedBy = assignment.assignedBy;
          existing.assignedOn = assignment.assignedOn;
          existing.activityLog.push({ activity: E_ASSIGNED });
          return task.save();
        }
        throw new ApiError('Add assignment not allowed.');
      }
      throw new ApiError('Task already assigned to user.');
    }

    assignment.activityLog.push({ activity: E_ASSIGNED });
    task.assignments.push(assignment);
    return task.save();
  };
  taskSchema.statics.removeAssignment = async function (taskId, userId) {
    const task = await validateAndReturnTask(taskId);

    const assignment = task.assignments.find(x => x.assignedTo.toString() === userId.toString());
    if (!assignment) throw new ApiError('Task not assigned to user.');

    const edge = edgeList.find(e =>
      e.from === assignment.status && e.name === E_REMOVED);

    if (edge) {
      assignment.activityLog.push({ activity: E_REMOVED });
      assignment.status = edge.to;
      return task.save();
    }

    throw new ApiError('Activity not permitted.');
  };
  taskSchema.statics.promoteAssignment = async function (taskId, userId) {
    const task = await validateAndReturnTask(taskId);

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
    const task = await validateAndReturnTask(taskId);

    const assignment = task
      .assignments
      .find(x => x.assignedTo.toString() === userId.toString());

    if (!(assignment && !assignment.deleted)) {
      throw new ApiError('Task not assigned to user.');
    }

    const nextStatus = getNextStatus(assignment, activity, task.leaderStatus);

    if (nextStatus) {
      assignment.activityLog.push({ activity });
      assignment.status = nextStatus;
      if (activity === E_MARK_COMPLETE) {
        taskEndAll(task);
        task.completedBy = userId;
      }
      return task.save();
    }

    throw new ApiError('Activity not permitted.');
  };
};
