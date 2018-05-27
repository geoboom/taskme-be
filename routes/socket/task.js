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

const taskAssignmentRoutes = [
  {
    path: '.add',
    handler: addAssignment,
    adminRequired: true,
  },
  {
    path: '.remove',
    handler: removeAssignment,
    adminRequired: true,
  },
  {
    path: '.promote',
    handler: promoteAssignment,
    adminRequired: true,
  },
  {
    path: '.activity',
    handler: assignmentActivity,
  },
];

const taskRoutes = [
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
  ...taskAssignmentRoutes.map(route => ({ ...route, path: `.assignment${route.path}` })),
];

module.exports = taskRoutes;
