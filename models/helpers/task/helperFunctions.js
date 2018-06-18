const {
  assignmentStatuses,
  allowedMemberActivities,
} = require('./assignmentStatuses');

const randomIntFromInterval = (min, max) => Math.floor((Math.random() * ((max - min) + 1)) + min);
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
  const randomHighestScorer = highestScorers[randomIntFromInterval(0, highestScorers.length - 1)];
  randomHighestScorer.isLeader = true;
  randomHighestScorer.activityLog.push({ activity: 'Promoted to Leader' });
  return randomHighestScorer;
};
const activityValid = (currentStatus, activity, isLeader, leaderStatus) => {
  if (activity === 'Mark Complete') {
    // check if currentStatus permits such activity
    return (isLeader && assignmentStatuses[currentStatus].outgoing.includes(activity));
  }

  if (assignmentStatuses[currentStatus].outgoing.includes(activity)
    && allowedMemberActivities.includes(activity)) {
    if (isLeader) {
      return true;
    }

    const leaderStatusS1 = assignmentStatuses[leaderStatus].scores.s1;
    const assignmentStatusesKeys = Object.keys(assignmentStatuses);
    let finalWorkerStatusObj;
    let assignmentStatusObj;
    let assignmentStatusName;
    for (let i = 0; i < assignmentStatusesKeys.length; i += 1) {
      assignmentStatusName = assignmentStatusesKeys[i];
      assignmentStatusObj = assignmentStatuses[assignmentStatusName];
      if (assignmentStatusObj.incoming.includes(activity)) {
        finalWorkerStatusObj = assignmentStatusObj;
        break;
      }
    }

    const finalWorkerStatusS1 = finalWorkerStatusObj.scores
      ? finalWorkerStatusObj.scores.s1 : 1;
    return finalWorkerStatusS1 <= leaderStatusS1;
  }

  return false;
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
const userIsTaskLeader = (userId, assignments) => {
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
const userIsValid = (userId, allUsers, group = null) => {
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
      const assignmentStatusesKeys = Object.keys(assignmentStatuses);
      let assignmentStatus;
      for (let j = 0; j < assignmentStatusesKeys.length; j += 1) {
        assignmentStatus = assignmentStatuses[assignmentStatusesKeys[i]];
        if (assignmentStatus.incoming.includes(taskEndActivity)) {
          assignment.status = assignmentStatus;
          break;
        }
      }
    }
  }
};

module.exports = {
  activityValid,
  getUniqueActivityTypes,
  getActiveParticipants,
  getLeaderCount,
  assignmentUniqueAssignedTo,
  assignmentMaxOneLeader,
  userIsTaskLeader,
  userIsValid,
  scoreBasedRandomLeader,
  taskEndAll,
};
