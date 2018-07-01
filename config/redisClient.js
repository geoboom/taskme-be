const { redis  } = require('../helpers/redisAsync');

const redisClient = redis.createClient(process.env.REDIS_URL);

module.exports = redisClient;
