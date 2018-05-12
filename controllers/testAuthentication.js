const {
  userSignup,
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
    const { _id } = req.user; // populated by passport middleware
    res.json(req.user);
  } catch (err) {
    next(err);
  }
};
