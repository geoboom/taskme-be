const crypto = require('crypto');
const {
  asyncRedisGet,
  asyncRedisSet,
  asyncRedisDel,
} = require('../helpers/redisAsync');

const generateToken = async () => crypto.randomBytes(12).toString('hex');

exports.storeToken = async (sessionId) => {
  let collision;
  let token;

  do {
    token = await generateToken();

    if (await asyncRedisGet(token)) {
      // collision
      collision = true;
    } else if (collision) {
      // collision resolved
      collision = false;
    }
  } while (collision);

  // we do not have a token key collision
  await asyncRedisSet(`tok:${token}`, sessionId, 'EX', 25); // set token key to expire after 5s
  return token;
};

exports.validateToken = async (token) => {
  const sessionId = await asyncRedisGet(`tok:${token}`);
  if (sessionId) {
    // valid
    await asyncRedisDel(`tok:${token}`); // is the await here necessary?
    return sessionId;
  }
  // no such token key exists; invalid
  return null;
};

exports.registerPresence = async (socket) => {
  const { userId, id, rooms, } = socket;
  return asyncRedisSet(`ws-presence:${userId}`, JSON.stringify({
    socketId: id,
    rooms,
  }), 'NX');
};

exports.destroyPresence = async (socket) => {
  const { userId } = socket;
  return asyncRedisDel(`ws-presence:${userId}`);
};