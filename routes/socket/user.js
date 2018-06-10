const {
  getAllUsers,
} = require('../../controllers/socket/user');
const {
  convertPathsToLeafs,
} = require('../../helpers/socketRoutesAugmenter');

const userRoutes = convertPathsToLeafs('user',
  [
    {
      path: '.getAll',
      handler: getAllUsers,
    },
  ]);


module.exports = userRoutes;
