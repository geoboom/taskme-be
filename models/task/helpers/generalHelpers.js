const User = require('../../user/User');

const allUsers = [];

module.exports.populateUsers = async () => {
  const temp = await User.find({}).exec();
  allUsers.push(...temp);
};
module.exports.userLeader = (userId, assignments) => {
  let assignment;

  for (let i = 0; i < assignments.length; i += 1) {
    assignment = assignments[i];
    if (assignment.assignedTo.toString() === userId.toString() && assignment.isLeader) {
      return true;
    }
  }

  return false;
};
module.exports.userValid = (userId, group = null) => {
  let user;

  for (let i = 0; i < allUsers.length; i += 1) {
    user = allUsers[i];
    if (user._id.toString() === userId.toString()
    && group ? user.group === group : true) {
      return true;
    }
  }

  return false;
};

module.exports.randomInt = (min, max) => Math.floor((Math.random() * ((max - min) + 1)) + min);
// const activityValid = (currentStatus, activity, isLeader, leaderStatus) => {
//   if (activity === 'Mark Complete') {
//     // check if currentStatus permits such activity
//     return (isLeader && assignmentStatuses[currentStatus].outgoing.includes(activity));
//   }
//
//   if (assignmentStatuses[currentStatus].outgoing.includes(activity)
//     && allowedMemberActivities.includes(activity)) {
//     if (isLeader) {
//       return true;
//     }
//
//     const leaderStatusS1 = assignmentStatuses[leaderStatus].scores.s1;
//     const assignmentStatusesKeys = Object.keys(assignmentStatuses);
//     let finalWorkerStatusObj;
//     let assignmentStatusObj;
//     let assignmentStatusName;
//     for (let i = 0; i < assignmentStatusesKeys.length; i += 1) {
//       assignmentStatusName = assignmentStatusesKeys[i];
//       assignmentStatusObj = assignmentStatuses[assignmentStatusName];
//       if (assignmentStatusObj.incoming.includes(activity)) {
//         finalWorkerStatusObj = assignmentStatusObj;
//         break;
//       }
//     }
//
//     const finalWorkerStatusS1 = finalWorkerStatusObj.scores
//       ? finalWorkerStatusObj.scores.s1 : 1;
//     return finalWorkerStatusS1 <= leaderStatusS1;
//   }
//
//   return false;
// };

// const getUniqueActivityTypes = () => {
//   const seen = {};
//   const uniqueActivityTypes = [];
//   let type;
//
//   Object.keys(assignmentStatuses).forEach((key) => {
//     for (let i = 0; i < assignmentStatuses[key].length; i += 1) {
//       type = assignmentStatuses[key][i];
//       if (!seen[type]) {
//         uniqueActivityTypes.push(type);
//         seen[type] = 1;
//       }
//     }
//   });
//
//   return uniqueActivityTypes;
// };
