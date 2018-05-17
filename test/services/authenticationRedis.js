/* eslint-disable no-console */
const { expect } = require('chai');
const mongoose = require('mongoose');

const sleep = require('util').promisify(setTimeout);
const {
  asyncRedisHGetAll,
  asyncRedisHGet,
  asyncRedisTTL,
  asyncRedisExpire,
  asyncRedisExists,
  asyncRedisHExists,
} = require('../../helpers/redisAsync');
const {
  generateAndPersistRefreshToken,
  validateRefreshToken,
  invalidateRefreshToken,
} = require('../../services/authentication');

describe('services/authentication.js redis', () => {
  const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 1 week, in s
  let refreshToken;
  let userId;
  const invalidRefreshToken = 'asdfghjklqweruiyoqweius';
  const testPayload = {
    _id: new mongoose.Types.ObjectId(),
    username: 'random_username',
    password: 'r4nd0m_p4ssw0$d',
  };

  describe('generateAndPersistRefreshToken', async () => {
    it(
      'should generate and store refresh token with correct userId as value',
      async () => {
        try {
          refreshToken = await generateAndPersistRefreshToken(testPayload);
          userId = await asyncRedisHGet('refresh-tokens', refreshToken);
          expect(userId).to.equal(testPayload._id.toString());
        } catch (err) {
          console.log(err);
          throw err;
        }
      },
    );

    it(
      'user:userId should point to the correct payload',
      async () => {
        try {
          const user = await asyncRedisHGetAll(`user:${userId}`);
          expect(user).to.deep.equal({ ...testPayload, _id: testPayload._id.toString() });
        } catch (err) {
          console.log(err);
          throw err;
        }
      },
    );

    it('ceil of ttl in days of user:userId should be REFRESH_TOKEN_EXPIRY in days', async () => {
      try {
        const ttl = await asyncRedisTTL(`user:${userId}`);
        expect(Math.ceil(ttl / (60 * 60 * 24 * 7)))
          .to
          .be
          .equal(REFRESH_TOKEN_EXPIRY / (60 * 60 * 24 * 7));
      } catch (err) {
        console.log(err);
        throw err;
      }
    });
  });

  describe('validateRefreshToken', async () => {
    it('should return correct user object for valid refreshToken', async () => {
      try {
        const user = await validateRefreshToken(refreshToken);
        expect(user).to.deep.equal({ ...testPayload, _id: testPayload._id.toString() });
      } catch (err) {
        console.log(err);
        throw err;
      }
    });

    it('should throw invalid refresh token error for non-existent refresh token', async () => {
      try {
        await validateRefreshToken(invalidRefreshToken);
      } catch (err) {
        expect(err).to.deep.equal({ message: 'Invalid refresh token.', status: 401 });
      }
    });

    it(
      'should delete refreshToken field, user:userId key and throw session expired error for expired refresh token',
      async () => {
        try {
          await asyncRedisExpire(`user:${userId}`, 1);
          await sleep(2000);
          // key user:userId should be expired
          await validateRefreshToken(refreshToken);
        } catch (err) {
          expect(await asyncRedisHExists('refresh-tokens', refreshToken)).to.equal(0);
          expect(await asyncRedisExists(`user:${userId}`)).to.equal(0);
          expect(err).to.deep.equal({ message: 'Session expired.', status: 401 });
        }
      },
    );
  });

  describe('invalidateRefreshToken', async () => {
    it('refreshToken field in hashmap and user:userId key should not exist after invalidation', async () => {
      try {
        refreshToken = await generateAndPersistRefreshToken(testPayload);
        const user = await validateRefreshToken(refreshToken);
        userId = user._id;
        expect(user).to.deep.equal({ ...testPayload, _id: testPayload._id.toString() });
        const pass = await invalidateRefreshToken(refreshToken);

        expect(await asyncRedisHExists('refresh-tokens', refreshToken)).to.equal(0);
        expect(await asyncRedisExists(`user:${userId}`)).to.equal(0);
        expect(pass).to.be.true;
      } catch (err) {
        console.log(err);
        throw err;
      }
    });
  });
});
