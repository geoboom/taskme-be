exports.initializeDB = db => (done) => {
  db.connect(`mongodb://geoboom:${process.env.DB_PASS}@ds029595.mlab.com:29595/taskme-db-${process.env.NODE_ENV}`);
  const dbConn = db.connection;
  dbConn.on('error', console.error.bind(console, 'connection error'));
  dbConn.once('open', () => {
    console.log('connected to test db');
    done();
  });
};
