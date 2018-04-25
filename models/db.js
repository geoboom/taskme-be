const mongoose = require('mongoose');

const dbConnect = () => {
  mongoose.connect(`mongodb://geoboom:${process.env.DB_PASS}@ds255309.mlab.com:55309/taskme-test-db`);

  mongoose.Promise = global.Promise;
};

module.exports = dbConnect;
