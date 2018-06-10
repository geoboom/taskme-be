const {
  getAllTasks,
  getAssignedTasks,
  addTask,
  editTask,
  removeTask,
  adminCompleteTask,
  addAssignment,
  removeAssignment,
  promoteAssignment,
  assignmentActivity,
} = require('../../controllers/socket/task');
const {
  convertPathsToLeafs,
} = require('../../helpers/socketRoutesAugmenter');

const assignmentPaths = [
  {
    path: '.addAssignment',
    handler: addAssignment,
    adminRequired: true,
  },
  {
    path: '.removeAssignment',
    handler: removeAssignment,
    adminRequired: true,
  },
  {
    path: '.promoteAssignment',
    handler: promoteAssignment,
    adminRequired: true,
  },
  {
    path: '.assignmentActivity',
    handler: assignmentActivity,
  },
];

const taskRoutes = convertPathsToLeafs('task',
  [
    {
      path: '.getAll',
      handler: getAllTasks,
      adminRequired: true,
    },
    {
      path: '.getAssigned',
      handler: getAssignedTasks,
    },
    {
      path: '.add',
      handler: addTask,
      adminRequired: true,
    },
    {
      path: '.edit',
      handler: editTask,
      adminRequired: true,
    },
    {
      path: '.remove',
      handler: removeTask,
      adminRequired: true,
    },
    {
      path: '.adminComplete',
      handler: adminCompleteTask,
      adminRequired: true,
    },
    ...assignmentPaths,
  ]);


module.exports = taskRoutes;
