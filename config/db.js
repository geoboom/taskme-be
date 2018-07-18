const mongoose = require('mongoose');

const DB_TEST_URL = `mongodb://geoboom:${process.env.DB_PASS}@ds029595.mlab.com:29595/taskme-db-test`;
const DB_STAGING_URL = `mongodb://geoboom:${process.env.DB_PASS}@ds141611.mlab.com:41611/taskme-db-staging`;

const dbConn = () => {
  mongoose.Promise = global.Promise;
  mongoose.connect(
    process.env.NODE_ENV === 'production' ? DB_STAGING_URL : DB_TEST_URL,
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
