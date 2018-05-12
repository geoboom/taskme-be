const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const {
  JWT_OPTIONS,
} = require('../config');
const {
  asyncRedisHSetNX,
} = require('../helpers/redisAsync');
const ApiError = require('../helpers/apiError');
const User = require('../models/user');

exports.userSignup = async (username, password) => {
  const user = await User.findOne({ username }).exec();
  if (user) {
    throw new ApiError('Username exists.', 409);
  }

  const newUser = new User({
    _id: new mongoose.Types.ObjectId(),
    username,
    password,
  });

  return newUser.save();
};

exports.generateRefreshToken = async (payload) => {
  let refreshToken;
  let reply;
  const refreshTokenKey = 'refresh-tokens';

  do {
    refreshToken = await crypto.randomBytes(48).toString('hex');
    reply = await asyncRedisHSetNX(refreshTokenKey, refreshToken, JSON.stringify(payload));
  } while (reply === 0); // reply = 0 if there is collision

  // no collision
  // reply = 1, field token successfully set to payload
  return refreshToken;
};

exports.validateRefreshToken = async (refreshToken, userId) => {
  const reply = await asyncRedisGet(`refresh-tok:${refreshToken}`);

  if (!reply) {
    throw new ApiError(
      'Invalid Refresh Token.',
      401,
    );
  }


  if (JSON.parse(reply).userId === userId) {
    return true;
  }


  throw new ApiError(
    'Wrong User.',
    401,
  );
};

exports.deleteRefreshToken = async refreshToken => {
  return asyncRedisDel(`refresh-tok:${refreshToken}`);
};

exports.generateAccessToken = payload =>
  // TODO: add other details e.g. role in payload
  jwt.sign(payload, process.env.JWT_SECRET, JWT_OPTIONS); // synchronous

