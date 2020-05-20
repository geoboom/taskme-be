const express = require('express');

const auth = require('./auth');
const upload = require('./upload');

const router = express.Router();

router.use('/auth', auth);
router.use(upload);

module.exports = router;
