const {
  userSignup,
  invalidateRefreshToken,
  generateAndPersistRefreshToken,
  generateAccessToken,
} = require('../services/authentication');
const User = require('../models/user');

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
      userData: res.locals.user,
      accessToken,
    });
  } catch (err) {
    next(err);
  }
};

exports.resetDatabaseGet = async (req, res, next) => {
  try {
    const JobComponent = require('../models/jobComponent');
    const JobCategory = require('../models/jobCategory');
    const Job = require('../models/job');
    const Task = require('../models/task');

    const response = await Promise.all([
      JobComponent.remove({}).exec(),
      JobCategory.remove({}).exec(),
      Job.remove({}).exec(),
      Task.remove({}).exec(),
      User.remove({}).exec(),
    ]);
    res.json({ response });
  } catch (e) {
    next(e);
  }
};

exports.registerAdminGet = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: 'administrator' }).exec();
    if (user) {
      next('Administrator user already exists.');
    }

    const newUser = await (new User({
      _id: new require('mongoose').Types.ObjectId(),
      username: 'administrator',
      password: 'P4ssword$123',
      group: 'admin',
    })).save();

    res.json({
      ...newUser._doc,
      passwordPlain: 'P4ssword$123',
    });
  } catch (e) {
    next(e);
  }
};
