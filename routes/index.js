const express = require('express');

// const connect = require('./connect');
const auth = require('./auth');

const router = express.Router();

router.use('/auth', auth);
// router.use('/connect', connect);

module.exports = router;
