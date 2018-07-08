/* eslint-disable no-await-in-loop */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const {
  JWT_OPTIONS,
} = require('../config/jwt');
const {
  redisClient,
  asyncRedisSet,
  asyncRedisGet,
  asyncRedisDel,
  asyncRedisHSetNX,
  asyncRedisHSet,
  asyncRedisHMSet,
  asyncRedisHGetAll,
  asyncRedisHGet,
  asyncRedisHDel,
  asyncRedisMulti,
  asyncRedisExpire,
} = require('../helpers/redisAsync');
const ApiError = require('../helpers/apiError');
const User = require('../models/user/User');

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 1 week, in s
const REFRESH_TOKEN_KEY = 'refresh-tokens';

exports.userSignup = async (username, password) => User.signup(username, password);

exports.generateAndPersistRefreshToken = async (payload) => {
  let refreshToken;
  let reply;

  do {
    refreshToken = await crypto.randomBytes(48).toString('hex');
    reply = await asyncRedisHSetNX(REFRESH_TOKEN_KEY, refreshToken, payload._id.toString());
  } while (reply === 0); // reply = 0 if there is collision

  // no collision
  // reply = 1, field token successfully set to payload._id
  await asyncRedisHMSet(`user:${payload._id}`, { ...payload, _id: payload._id.toString() });
  await asyncRedisExpire(`user:${payload._id}`, REFRESH_TOKEN_EXPIRY);

  return refreshToken;
};

exports.validateRefreshToken = async (refreshToken) => {
  const reply = await asyncRedisHGet(REFRESH_TOKEN_KEY, refreshToken);

  if (!reply) {
    throw new ApiError(
      'Invalid refresh token.',
      401,
    );
  }

  const user = await asyncRedisHGetAll(`user:${reply}`);
  if (user) {
    return user;
  }

  // user key does not exist or is expired => remove associated refresh token
  await asyncRedisHDel(REFRESH_TOKEN_KEY, refreshToken);
  throw new ApiError(
    'Session expired.',
    401,
  );
};

exports.invalidateRefreshToken = async (refreshToken) => {
  const userId = await asyncRedisHGet(REFRESH_TOKEN_KEY, refreshToken);
  const reply =
    await redisClient
      .multi()
      .hdel(REFRESH_TOKEN_KEY, refreshToken)
      .del(`user:${userId}`)
      .asyncExec();

  let pass = true;
  for (let i = 0; i < reply.length; i += 1) {
    if (reply[i] !== 1) {
      pass = false;
      break;
    }
  }

  return pass;
};

exports.generateAccessToken = payload =>
  jwt.sign(payload, process.env.JWT_SECRET, JWT_OPTIONS); // synchronous

exports.submitDeviceToken = async (_id, deviceToken) =>
  User.submitDeviceToken(_id, deviceToken);

exports.updateCachedUser = async (user) => {
  await asyncRedisHMSet(
    `user:${user._id}`,
    { ...user, _id: user._id.toString() },
  );
};
