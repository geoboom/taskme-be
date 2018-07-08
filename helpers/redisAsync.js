const redis = require('redis');
const { promisify } = require('util');

redis.Multi.prototype.asyncExec = promisify(redis.Multi.prototype.exec);

module.exports.redis = redis;

const redisClient = require('../config/redisClient');

module.exports = {
  redisClient,
  asyncRedisGet: promisify(redisClient.get).bind(redisClient),
  asyncRedisMGet: promisify(redisClient.mget).bind(redisClient),
  asyncRedisSet: promisify(redisClient.set).bind(redisClient),
  asyncRedisDel: promisify(redisClient.del).bind(redisClient),
  asyncRedisExists: promisify(redisClient.exists).bind(redisClient),
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
  asyncRedisMulti: promisify(redisClient.multi).bind(redisClient),
  asyncRedisExpire: promisify(redisClient.expire).bind(redisClient),
  asyncRedisTTL: promisify(redisClient.ttl).bind(redisClient),
};
