const express = require('express');
const logger = require('morgan');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const bodyParser = require('body-parser');

const router = require('./routes');
const dbConnect = require('./models/db');
const redisClient = require('./services/redisClient');
const errorHandler = require('./middleware/errorHandler');

const redisStoreOptions = {
  client: redisClient,
};

const sessionOptions = {
  store: new RedisStore(redisStoreOptions),
  secret: 'abc123',
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24h
  },
};

dbConnect();
const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session(sessionOptions));

app.use('/api', router);

errorHandler(app);

module.exports = app;
