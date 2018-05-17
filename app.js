const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport');

const router = require('./routes');
const dbConn = require('./models/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
dbConn();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

app.use('/api', router);
app.get('/', (req, res, next) => res.send('taskme api'));

errorHandler(app);

module.exports = app;
