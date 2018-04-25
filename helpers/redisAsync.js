const { promisify } = require('util');
const redisClient = require('../services/redisClient');

module.exports = {
  asyncRedisGet: promisify(redisClient.get).bind(redisClient),
  asyncRedisSet: promisify(redisClient.set).bind(redisClient),
  asyncRedisDel: promisify(redisClient.del).bind(redisClient),
};
