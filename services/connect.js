const crypto = require('crypto');
const {
  asyncRedisGet,
  asyncRedisSet,
  asyncRedisDel,
  asyncRedisKeys,
  asyncRedisHSetNX,
  asyncRedisHSet,
  asyncRedisHDel,
  asyncRedisHGetAll,
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

exports.registerPresence = async (socket) => {
  const { user, id } = socket;
  return asyncRedisHSet('ws-presence', user._id, id);
};

exports.destroyPresence = async (socket) => {
  const { user } = socket;
  return asyncRedisHDel('ws-presence', user._id);
};

exports.getWsPresence = async () => asyncRedisHGetAll('ws-presence');
