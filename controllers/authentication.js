const {
  userSignup,
  generateRefreshToken,
  deleteRefreshToken,
  generateAccessToken,
} = require('../services/authentication');

exports.signupPost = async (req, res, next) => {
  try {
    const user = await userSignup(req.body.username, req.body.password);
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.loginPost = async (req, res, next) => {
  try {
    // const token = await generateRefreshToken({
    //   userId: _id,
    // });
    res.json({
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

exports.tokenPost = async (req, res, next) => {
  try {
    // userId has been authenticated with refresh token
    const payload = { userId: req.body.userId };
    // TODO: fetch more user data e.g. roles from db and include in payload
    const accessToken = generateAccessToken(payload);

    res.json({
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};
