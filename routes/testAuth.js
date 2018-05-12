const express = require('express');
const passport = require('passport');

const router = express.Router();

const {
  signupPost,
  loginPost,
} = require('../controllers/testAuthentication');

router.post(
  '/signup',
  signupPost,
);

router.post(
  '/login',
  passport.authenticate('local', { session: false }),
  loginPost,
);

module.exports = router;
