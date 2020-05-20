const {
  asyncRedisGet,
  asyncRedisSet,
  asyncRedisDel,
  asyncRedisKeys,
  asyncRedisHSetNX,
  asyncRedisHSet,
  asyncRedisHDel,
  asyncRedisHGet,
  asyncRedisHMGet,
  asyncRedisHGetAll,
} = require('../helpers/redisAsync');

exports.registerPresence = async (socket) => {
  const { user, id } = socket;
  return asyncRedisHSetNX('ws-presence', user._id, id);
};

exports.unregisterPresence = async (socket) => {
  const { user } = socket;
  return asyncRedisHDel('ws-presence', user._id);
};

exports.getPresence = async userId => asyncRedisHGet('ws-presence', userId);

exports.getPresenceMap = async (arrUserId) => {
  const presenceMap = {};
  const res = await asyncRedisHMGet('ws-presence', arrUserId);
  res.forEach((r, i) => {
    presenceMap[arrUserId[i]] = r;
  });
  return presenceMap;
};

exports.getAllPresence = async () => asyncRedisHGetAll('ws-presence');
