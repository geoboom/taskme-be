const express = require('express');
const passport = require('passport');

const {
  rootGet,
} = require('../controllers/connect');

const router = express.Router();

router.get(
  '/',
  passport.authenticate('local', { session: false }),
  rootGet,
);

module.exports = router;
