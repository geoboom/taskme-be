const crypto = require('crypto');
const {
  asyncRedisGet,
  asyncRedisSet,
  asyncRedisDel,
  asyncRedisKeys,
} = require('../helpers/redisAsync');

const generateToken = async () => crypto.randomBytes(12).toString('hex');

exports.storeToken = async (payload) => {
  let reply;
  let token;
  const payloadStr = JSON.stringify(payload);

  do {
    token = await generateToken();
    reply = await asyncRedisSet(`tok:${token}`, payloadStr, 'NX', 'EX', 25);
    // reply is nil if there is already a key = token set
  } while (!reply);

  // we do not have a token key collision
  return token;
};

exports.validateToken = async (token) => {
  const payload = await asyncRedisGet(`tok:${token}`);

  asyncRedisDel(`tok:${token}`);
  return payload; // null (invalid) or payload (valid)
};

exports.registerPresence = async (socket) => {
  const { userId, username, id } = socket;
  return asyncRedisSet(`ws-presence:${userId}`, JSON.stringify({
    username,
    socketId: id,
  }), 'NX');
};

exports.destroyPresence = async (socket) => {
  const { userId } = socket;
  return asyncRedisDel(`ws-presence:${userId}`);
};

exports.getAllPresence = async () => {
  const wsKeys = await asyncRedisKeys('ws-presence:*');
  const wsValues = [];
  for (key in wsKeys) {
    wsValues = [...wsValues, await asyncRedisGet(key)];
  }

  return wsValues;
};
