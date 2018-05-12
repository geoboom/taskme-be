/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const mongoose = require('mongoose');

const User = require('../../models/user');
const sleep = require('util').promisify(setTimeout);

describe('/models/user.js', () => {
  before((done) => {
    mongoose.connect(`mongodb://geoboom:${process.env.DB_PASS}@ds029595.mlab.com:29595/taskme-db-${process.env.NODE_ENV}`);
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error'));
    db.once('open', () => {
      console.log('connected to test db');
      done();
    });
  });

  const GOOD_USERNAME = 'goodUsername';
  const GOOD_PASSWORD = 'p@sSw0rd-123';
  const CORRECT_USERNAME = GOOD_USERNAME;
  const CORRECT_PASSWORD = GOOD_PASSWORD;
  const WRONG_USERNAME = 'wrong-username';
  const WRONG_PASSWORD = 'wrong-pw';

  describe('userSchema.statics.comparePassword', () => {
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      username: GOOD_USERNAME,
      password: GOOD_PASSWORD,
    });

    let user;

    it('should fail if password is wrong', async () => {
      try {
        await User.remove({}).exec();
        user = await newUser.save();
        await user.comparePassword(WRONG_PASSWORD);
      } catch (err) {
        expect(err).to.exist;
      }
    });

    it('should pass if password is right', async () => {
      try {
        const match = await user.comparePassword(CORRECT_PASSWORD);
        expect(match).to.be.true;
      } catch (err) {
        console.log('ERROR:', err);
        throw new Error(err);
      }
    });
  });

  describe('userSchema.statics.incLoginAttempts', () => {
    it('should have 0 login attempts', async () => {
      try {
        const user = await User.findOne({ username: CORRECT_USERNAME }).exec();
        expect(user.loginAttempts).to.equal(0);
      } catch (err) {
        console.log('ERROR:', err);
        throw new Error(err);
      }
    });

    it('should have 1 login attempts', async () => {
      try {
        const user = await User.findOne({ username: CORRECT_USERNAME }).exec();
        await user.incLoginAttempts();
        const newUser = await User.findOne({ username: CORRECT_USERNAME }).exec();
        expect(newUser.loginAttempts).to.equal(1);
      } catch (err) {
        console.log('ERROR:', err);
        throw new Error(err);
      }
    });
  });

  describe('userSchema.statics.getAuthenticated', () => {
    it('should return user object on successful authentication', async () => {
      try {
        const user = await User.getAuthenticated(CORRECT_USERNAME, CORRECT_PASSWORD);
        expect(user).to.include({ username: GOOD_USERNAME });
        expect(user).to.have.property('password');
        expect(user).to.have.property('_id');
      } catch (err) {
        console.log('ERROR:', err);
        throw new Error(err);
      }
    });

    it('should error on user not found', async () => {
      try {
        await User.getAuthenticated(WRONG_USERNAME, CORRECT_PASSWORD);
      } catch (err) {
        expect(err).to.deep.equal({ message: 'Wrong username or password.', status: 401 });
      }
    });

    describe('password incorrect tests', () => {
      const bruteForceTest = (i) => {
        it('should error on password incorrect', async () => {
          try {
            await User.getAuthenticated(CORRECT_USERNAME, WRONG_PASSWORD);
          } catch (err) {
            expect(err).to.deep.equal({ message: 'Wrong username or password.', status: 401 });
          }
        });

        it(`should have ${i} loginAttempts`, async () => {
          try {
            const user = await User.findOne({ username: CORRECT_USERNAME });
            expect(user.loginAttempts).to.equal(i);
          } catch (err) {
            console.log('ERROR:', err);
            throw new Error(err);
          }
        });
      };
      for (let i = 1; i <= 5; i += 1) {
        bruteForceTest(i);
      }

      it('should temporarily lock account after 5th consecutive incorrect try regardless of password correctness', async () => {
        try {
          await User.getAuthenticated(CORRECT_USERNAME, CORRECT_PASSWORD);
        } catch (err) {
          expect(err).to.deep.equal({ message: 'Account temporarily locked.', status: 403 });
        }
      });

      it('user should be unlocked if user.lockUntil <= Date.now()', async () => {
        try {
          const user = await User.findOneAndUpdate(
            { username: CORRECT_USERNAME },
            { $set: { lockUntil: Date.now() } },
            { new: true },
          ).exec();

          await sleep(5);
          expect(user.isLocked).to.be.false;
        } catch (err) {
          console.log('ERROR:', err);
          throw new Error(err);
        }
      });
    });
  });

  after((done) => {
    const db = mongoose.connection;
    db.close();
    db.once('close', () => {
      console.log('db connection closed');
      done();
    });
  });
});
