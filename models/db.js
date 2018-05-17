const mongoose = require('mongoose');

const dbConn = () => {
  mongoose.Promise = global.Promise;
  mongoose.connect(
    `mongodb://geoboom:${process.env.DB_PASS}@ds029595.mlab.com:29595/taskme-db-test`,
    (err) => {
      if (err) {
        console.log('env =', process.env.NODE_ENV);
        console.log('error connecting to db:', err);
        console.log('exiting...');
        process.exit(1);
      }
    },
  );

  return mongoose.connection;
};

module.exports = dbConn;
