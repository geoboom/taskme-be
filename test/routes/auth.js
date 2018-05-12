/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const request = require('supertest');

const { app } = require('../../bin/www');
const User = require('../../models/user');

describe('/test/auth.js', () => {
  const GOOD_USERNAME = 'goodUsername';
  const GOOD_PASSWORD = 'p@sSw0rd-123';
  const CORRECT_USERNAME = GOOD_USERNAME;
  const CORRECT_PASSWORD = GOOD_PASSWORD;
  const WRONG_USERNAME = 'wrong-username';
  const WRONG_PASSWORD = 'wrong-pw';

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

  it('should login successfully', (done) => {
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

        console.log(res.body);
        expect(res.body).to.exist;
        done();
      });
  });

  after((done) => {
    User.remove({}).then(() => done());
  });
});
