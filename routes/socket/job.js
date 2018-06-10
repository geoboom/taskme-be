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
const {
  convertPathsToLeafs,
  prependRootToLeafs,
} = require('../../helpers/socketRoutesAugmenter');

const jobCategoryActions = convertPathsToLeafs('.category', [
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
]);

const jobComponentActions = convertPathsToLeafs('.component', [
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
]);

const jobRoutes = [
  ...convertPathsToLeafs('job', [
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
    }]),
  ...prependRootToLeafs('job', jobCategoryActions),
  ...prependRootToLeafs('job', jobComponentActions),
];

module.exports = jobRoutes;
