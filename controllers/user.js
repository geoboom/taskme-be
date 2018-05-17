const mongoose = require('mongoose');

const {
  asyncRedisGet,
  asyncRedisSet,
  asyncRedisDel,
} = require('../helpers/redisAsync');
const ApiError = require('../helpers/apiError');
const User = require('../models/user');

exports.userRegister = async (username, password) => {
  const user = await User.find({ username }).exec();
  if (user.length >= 1) {
    throw new ApiError('Username exists.', 409);
  }

  const newUser = new User({
    _id: new mongoose.Types.ObjectId(),
    username,
    password,
  });

  return newUser.save();
};

exports.userLogin = async (username, password) => {
  const user = await User.findOne({ username }).exec();
  if (!user || user.password !== password) {
    throw new ApiError('Authentication failed.', 401);
  }

  return user;
};

exports.getAllUsers = async () => {
  return User.find({}).exec();
};

exports.storeUserSession = async (userId, req) => {
  const reply = await asyncRedisSet(`sess:${userId}`, `sess:${req.sessionID}`);
  req.session.userId = userId;
  return reply;
};

exports.deleteUserSession = async (userId, req) => {
  const reply = await asyncRedisDel(`sess:${userId}`);
  req.session.destroy((err) => {
    if (err) {
      throw new Error(err);
    }
    return reply;
  });
};

exports.getUserSession = async (sessionId) => {
  return asyncRedisGet(`sess:${sessionId}`);
};
