const express = require('express');
const {
  userRegister,
  userLogin,
  getAllUsers,
  storeUserSession,
  deleteUserSession,
} = require('../controllers/user');

const router = express.Router();


router.post('/register', async (req, res, next) => {
  if (req.session.userId) {
    return next({
      message: 'Already logged in.',
      status: 500,
    });
  }

  try {
    const { username, password } = req.body;
    const result = await userRegister(username, password);
    const reply = await storeUserSession(result._id, req);
    console.log(reply);

    res.json({
      e: 'Registration successful.',
      d: {
        _id: result._id,
        username,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await userLogin(username, password);
    const reply = await storeUserSession(result._id, req);
    console.log(reply);

    res.json({
      e: 'Login successful.',
      d: {
        _id: result._id,
        username,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/logout', async (req, res, next) => {
  const { userId } = req.session;
  if (!userId) {
    return next({
      message: 'Not logged in.',
      status: 401,
    });
  }

  try {
    const reply = await deleteUserSession(userId, req);
    console.log(reply);

    res.json({
      e: 'Logout successful.',
      d: {},
    });
  } catch (err) {
    next(err);
  }
});

router.get('/info', async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.json({
      e: '',
      d: users,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
