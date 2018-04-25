const express = require('express');

const {
  storeToken,
} = require('../controllers/connect');

const router = express.Router();

router.get('/', async (req, res, next) => {
  if (!req.session.userId) {
    return next({
      status: 401,
      message: 'Not logged in.',
    });
  }

  try {
    const token = await storeToken(req.sessionID);
    res.json({
      e: 'Token generated.',
      d: {
        tok: token,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
