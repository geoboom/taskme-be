const express = require('express');
const passport = require('passport');

const {
  refreshTokenAuthentication,
} = require('../middleware/authentication');
const {
  userFromGroup,
} = require('../middleware/authorization');
const {
  signupPost,
  loginPost,
  tokenPost,
  registerAdminGet,
  resetDatabaseGet,
} = require('../controllers/authentication');

const router = express.Router();

router.get(
  '/resetDatabase',
  resetDatabaseGet,
);

router.get(
  '/registerAdmin',
  registerAdminGet,
);

router.post(
  '/signup',
  signupPost,
);

router.post(
  '/login',
  passport.authenticate('local', { session: false }),
  loginPost,
);

// router.put(
//   '/changepw',
//   passport.authenticate('local', { session: false }),
//   changepwPut,
// );

router.post(
  '/token',
  refreshTokenAuthentication,
  tokenPost,
);

router.get(
  '/secret',
  passport.authenticate('jwt', { session: false }),
  userFromGroup('admin'),
  async (req, res, next) => {
    // user has valid access token (authenticated) and is of correct group (authorized)
    res.json({
      status: 'authorized',
    });
  },
);

module.exports = router;
