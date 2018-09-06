const {
  userSignup,
  invalidateRefreshToken,
  generateAndPersistRefreshToken,
  generateAccessToken,
  submitDeviceToken,
  updateCachedUser,
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
    const {
      user: {
        _id,
        username,
        group,
        lastSuccessfulLoginTimestamp,
        deviceToken,
      },
    } = req;
    // to add user profile picture and other metadata
    const userData = {
      _id,
      username,
      group,
      lastSuccessfulLoginTimestamp,
      deviceToken,
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
    const { deviceToken } = req.body;
    const { _id } = res.locals.user;
    await submitDeviceToken(_id, deviceToken.token);
    await updateCachedUser({
      ...res.locals.user,
      deviceToken: deviceToken.token,
    });
    res.json({
      deviceToken: deviceToken.token,
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

exports.logoutPost = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const reply = await invalidateRefreshToken(refreshToken);
    res.json({
      loggedOut: reply,
    });
  } catch (e) {
    next(e);
  }
};
