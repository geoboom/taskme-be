/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const mongoose = require('mongoose');

const User = require('../../models/user');
const {
  userSignup,
} = require('../../services/authentication');

describe('services/authentication.js mongo', () => {
  // Before starting test, create sandboxed database connection and invoke done() once established

  before((done) => {
    mongoose.connect(`mongodb://geoboom:${process.env.DB_PASS}@ds029595.mlab.com:29595/taskme-db-test`);
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error'));
    db.once('open', () => {
      console.log('connected to test db');
      done();
    });
  });

  describe('userSignup', () => {
    const GOOD_USERNAME = 'goodUsername';
    const BAD_USERNAME = 'rawr';
    const GOOD_PASSWORD = 'p@sSw0rd-123';
    const BAD_PASSWORD = 'password';


    it('should return user object upon successful signup', async () => {
      try {
        await User.remove({}).exec(); // cleanup
        const user = await userSignup(GOOD_USERNAME, GOOD_PASSWORD);
        expect(user).to.include({ username: GOOD_USERNAME });
        expect(user).to.have.property('password');
        expect(user).to.have.property('_id');
      } catch (err) {
        console.error('ERROR:', err);
        throw new Error(err);
      }
    });

    it('should return object { message: \'Username exists.\', status: 409 }', async () => {
      try {
        await userSignup(GOOD_USERNAME, GOOD_PASSWORD);
      } catch (err) {
        expect(err).to.deep.equal({ message: 'Username exists.', status: 409 });
      }
    });

    it('should be invalid if username bad', async () => {
      try {
        await userSignup(BAD_USERNAME, GOOD_PASSWORD);
      } catch (err) {
        expect(err.errors.username).to.exist;
      }
    });

    it('should be invalid if password bad', async () => {
      try {
        await User.remove({}).exec(); // cleanup
        await userSignup(GOOD_USERNAME, BAD_PASSWORD);
      } catch (err) {
        expect(err.errors.password).to.exist;
      }
    });

    it('should be invalid if username and password bad', async () => {
      try {
        await userSignup(BAD_USERNAME, BAD_PASSWORD);
      } catch (err) {
        expect(err.errors.password).to.exist;
      }
    });
  });

  after(async () => {
    await User.remove({}).exec();
    const db = mongoose.connection;
    await db.close();
  });
});
