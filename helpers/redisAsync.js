const { promisify } = require('util');
const redisClient = require('./redisClient');

module.exports = {
  asyncRedisGet: promisify(redisClient.get).bind(redisClient),
  asyncRedisSet: promisify(redisClient.set).bind(redisClient),
  asyncRedisDel: promisify(redisClient.del).bind(redisClient),
  asyncRedisKeys: promisify(redisClient.keys).bind(redisClient),
  asyncRedisHSet: promisify(redisClient.hset).bind(redisClient),
  asyncRedisHSetNX: promisify(redisClient.hsetnx).bind(redisClient),
  asyncRedisHGet: promisify(redisClient.hget).bind(redisClient),
  asyncRedisHGetAll: promisify(redisClient.hgetall).bind(redisClient),
  asyncRedisHMGet: promisify(redisClient.hmget).bind(redisClient),
  asyncRedisHMSet: promisify(redisClient.hmset).bind(redisClient),
  asyncRedisHLen: promisify(redisClient.hlen).bind(redisClient),
  asyncRedisHKeys: promisify(redisClient.hkeys).bind(redisClient),
  asyncRedisHDel: promisify(redisClient.hdel).bind(redisClient),
  asyncRedisHExists: promisify(redisClient.hexists).bind(redisClient),
};
