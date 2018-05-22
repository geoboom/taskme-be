const {
  getAllJobs,
  addJob,
  editJob,
  removeJob,
  getAllCategories,
  addCategory,
  removeCategory,
  getAllComponents,
  addComponent,
  removeComponent,
} = require('../../controllers/socket/job');

const jobCategoryRoutes = [
  {
    path: '.getAll',
    handler: getAllCategories,
    adminRequired: true,
  },
  {
    path: '.add',
    handler: addCategory,
    adminRequired: true,
  },
  {
    path: '.remove',
    handler: removeCategory,
    adminRequired: true,
  },
];

const jobComponentRoutes = [
  {
    path: '.getAll',
    handler: getAllComponents,
    adminRequired: true,
  },
  {
    path: '.add',
    handler: addComponent,
    adminRequired: true,
  },
  {
    path: '.remove',
    handler: removeComponent,
    adminRequired: true,
  },
];

const jobRoutes = [
  {
    path: '.getAll',
    handler: getAllJobs,
    adminRequired: true,
  },
  {
    path: '.add',
    handler: addJob,
    adminRequired: true,
  },
  {
    path: '.edit',
    handler: editJob,
    adminRequired: true,
  },
  {
    path: '.remove',
    handler: removeJob,
    adminRequired: true,
  },
  ...jobCategoryRoutes.map(route => ({ ...route, path: `.category${route.path}` })),
  ...jobComponentRoutes.map(route => ({ ...route, path: `.component${route.path}` })),
];

module.exports = jobRoutes;
