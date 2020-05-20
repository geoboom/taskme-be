const {
  V_PENDING_ACCEPT,
  V_NOT_STARTED,
  V_IN_PROGRESS,
  V_PAUSED,
  V_COMPLETED,
} = require('./assignmentGraph');

const V_TASK_UNASSIGNED = 'Unassigned';
const V_TASK_PENDING_LEADER_ACCEPT = 'Pending leader accept';
const V_TASK_NOT_STARTED = 'Not started';
const V_TASK_IN_PROGRESS = 'In progress';
const V_TASK_PAUSED = 'Paused';
const V_TASK_COMPLETED = 'Completed';

const mapStatusLeaderToTask = {
  [V_PENDING_ACCEPT]: V_TASK_PENDING_LEADER_ACCEPT,
  [V_NOT_STARTED]: V_TASK_NOT_STARTED,
  [V_IN_PROGRESS]: V_TASK_IN_PROGRESS,
  [V_PAUSED]: V_TASK_PAUSED,
  [V_COMPLETED]: V_TASK_COMPLETED,
};

module.exports = {
  V_TASK_UNASSIGNED,
  V_TASK_PENDING_LEADER_ACCEPT,
  V_TASK_NOT_STARTED,
  V_TASK_IN_PROGRESS,
  V_TASK_PAUSED,
  V_TASK_COMPLETED,
  mapStatusLeaderToTask,
};
