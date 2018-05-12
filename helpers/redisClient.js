const redisClient = require('redis').createClient(process.env.REDIS_URL);

module.exports = redisClient;
