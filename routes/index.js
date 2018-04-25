const express = require('express');

const connectRouter = require('./connect');
const user = require('./user');

const router = express.Router();

router.use('/user', user);
router.use('/connect', connectRouter);

module.exports = router;
