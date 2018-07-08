const {
  userSignup,
  invalidateRefreshToken,
  generateAndPersistRefreshToken,
  generateAccessToken,
  submitDeviceToken,
} = require('../services/authentication');
const User = require('../models/user/User');

exports.signupPost = async (req, res, next) => {
  try {
    const user = await userSignup(req.body.username, req.body.password);
    const {
      _id,
      username,
      group,
    } = user;
    const userData = {
      _id,
      username,
      group,
    };
    req.app.locals.io.emit('user', { d: userData });
    res.json(userData);
  } catch (err) {
    next(err);
  }
};

exports.loginPost = async (req, res, next) => {
  try {
    const { user } = req;
    // to add user profile picture and other metadata
    console.log(req.user);
    const userData = {
      _id: user._id,
      username: user.username,
      group: user.group,
      lastSuccessfulLoginTimestamp: user.lastSuccessfulLoginTimestamp,
      hasDeviceToken: user.deviceToken !== '',
    };

    const refreshToken = await generateAndPersistRefreshToken(userData);

    res.json({
      refreshToken,
      userData,
    });
  } catch (err) {
    next(err);
  }
};

exports.deviceTokenPost = async (req, res, next) => {
  try {
    console.log(req.user);
    const { user: { _id }, deviceToken } = req;
    await submitDeviceToken(_id, deviceToken);
    res.json({
      deviceToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.tokenPost = async (req, res, next) => {
  try {
    const accessToken = generateAccessToken(res.locals.user);
    res.json({
      userData: res.locals.user,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};
