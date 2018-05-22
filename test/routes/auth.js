/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const request = require('supertest');
const jwt = require('jsonwebtoken');

const { app } = require('../../bin/www');
const User = require('../../models/user');

describe('/test/auth.js', () => {
  const GOOD_USERNAME = 'goodUsername';
  const GOOD_PASSWORD = 'p@sSw0rd-123';
  const CORRECT_USERNAME = GOOD_USERNAME;
  const CORRECT_PASSWORD = GOOD_PASSWORD;
  const WRONG_USERNAME = 'wrong-username';
  const WRONG_PASSWORD = 'wrong-pw';
  let refreshToken;
  let accessToken;

  describe('POST /api/auth/signup', () => {
    it('should register successfully', (done) => {
      request(app)
        .post('/api/auth/signup')
        .send({
          username: GOOD_USERNAME,
          password: GOOD_PASSWORD,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) throw err;
          done();
        });
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully and res.body should have' +
      ' refreshToken and userData properties', (done) => {
      request(app)
        .post('/api/auth/login')
        .send({
          username: GOOD_USERNAME,
          password: GOOD_PASSWORD,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) throw err;

          expect(res.body).to.have.property('refreshToken');
          refreshToken = res.body.refreshToken;
          expect(res.body).to.have.property('userData');
          done();
        });
    });
  });

  describe('POST /api/auth/token', () => {
    it('should receive accessToken in res.body', (done) => {
      request(app)
        .post('/api/auth/token')
        .send({
          refreshToken,
        })
        .set('Content-Type', 'application/json')
        .set('Accept', 'application/json')
        .expect(200)
        .end((err, res) => {
          if (err) throw err;

          expect(res.body).to.have.property('accessToken');
          accessToken = res.body.accessToken;
          done();
        });
    });
  });

  describe('GET /api/auth/secret', () => {
    it('should return 401 without bearer token', (done) => {
      request(app)
        .get('/api/auth/secret')
        .set('Accept', 'application/json')
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
    });

    it('should return 200 if bearer token valid', (done) => {
      request(app)
        .get('/api/auth/secret')
        .set('Accept', 'application/json')
        .set('Authorization', `bearer ${accessToken}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
    });

    it('should return 401 if bearer token expired', (done) => {
      const decoded = jwt.decode(accessToken, { complete: true });
      const {
        _id, username, group, lastSuccessfulLoginTimestamp, ...rest
      } = decoded.payload;
      const payload = {
        _id, username, group, lastSuccessfulLoginTimestamp,
      };
      const expiredAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1ms' });

      request(app)
        .get('/api/auth/secret')
        .set('Accept', 'application/json')
        .set('Authorization', `bearer ${expiredAccessToken}`)
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
    });

    it('should return 401 if bearer token signature invalid', (done) => {
      const payload = { rawr: 'xd' };
      const invalidAccessToken = jwt.sign(payload, 'secret', { expiresIn: '60s' });

      request(app)
        .get('/api/auth/secret')
        .set('Accept', 'application/json')
        .set('Authorization', `bearer ${invalidAccessToken}`)
        .expect(401)
        .end((err, res) => {
          if (err) return done(err);
          done();
        });
    });
  });

  after((done) => {
    User.remove({}).then(() => done());
  });
});
