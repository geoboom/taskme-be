/* eslint-disable no-param-reassign,global-require */
const {
  vertexSet,
  vertexEndEdges,
  edgeList,
} = require('../constants/assignmentGraph');
const ApiError = require('../../../helpers/apiError');
const { randomInt } = require('./generalHelpers');

module.exports.taskScoreRandomLeader = (assignments) => {
  let highest = 0;
  let eligible = [];

  let score;
  assignments.forEach((a) => {
    if (!a.deleted) {
      score = vertexSet[a.status].scores.s2;
      if (score > highest) {
        highest = score;
        eligible = [a];
      } else if (score === highest) {
        eligible.push(a);
      }
    }
  });
  // Set a random highest scorer to be leader
  const random = eligible[randomInt(0, eligible.length - 1)];
  random.isLeader = true;
  random.activityLog.push({ activity: 'Promoted to Leader' });
  return random;
};

module.exports.taskGetActiveMembers = (assignments) => {
  const activeMembers = [];
  let assignment;
  for (let i = 0; i < assignments.length; i += 1) {
    assignment = assignments[i];
    if (!assignment.deleted) {
      activeMembers.push(assignment);
    }
  }

  return activeMembers;
};

module.exports.taskLeaderCount = (assignments) => {
  let leaderCount = 0;
  for (let i = 0; i < assignments.length; i += 1) {
    if (assignments[i].isLeader) {
      leaderCount += 1;
    }
  }
  return leaderCount;
};

module.exports.taskAssignedTosAreDistinct = (assignments) => {
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

module.exports.taskEndAll = (task) => {
  const { assignments } = task;

  let vStatus;
  let taskEndActivity;
  let edge;
  let vDest;
  assignments.forEach((a) => {
    if (!a.deleted) {
      vStatus = vertexSet[a.status];
      taskEndActivity = vertexEndEdges[vStatus.name];
      edge = edgeList.find(e => e.from === vStatus.name && e.name === taskEndActivity);
      if (edge) {
        vDest = vertexSet[edge.to];
        a.activityLog.push({ taskEndActivity });
        a.status = vDest.name;
      }
    }
  });
};

module.exports.validateAndReturnTask = async (_id) => {
  const Task = require('../Task');
  const task = await Task.findOne({ _id }).exec();
  if (!task) throw new ApiError('Task not found.', 404);
  if (task.isCompleted) {
    throw new ApiError('Task already completed.');
  }

  return task;
};
