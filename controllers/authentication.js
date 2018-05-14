const {
  userSignup,
  invalidateRefreshToken,
  generateAndPersistRefreshToken,
  generateAccessToken,
} = require('../services/authentication');

exports.signupPost = async (req, res, next) => {
  try {
    const user = await userSignup(req.body.username, req.body.password);
    const userData = {
      _id: user._id,
      username: user.username,
      group: user.group,
    };
    res.json(userData);
  } catch (err) {
    next(err);
  }
};

exports.loginPost = async (req, res, next) => {
  try {
    const user = req.user;
    // to add user profile picture and other metadata
    const userData = {
      _id: user._id,
      username: user.username,
      group: user.group,
      lastSuccessfulLoginTimestamp: user.lastSuccessfulLoginTimestamp,
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

exports.tokenPost = async (req, res, next) => {
  try {
    const accessToken = generateAccessToken(res.locals.user);
    res.json({
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};
