/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const mongoose = require('mongoose');

const JobComponent = require('../../models/jobComponent');
const sleep = require('util').promisify(setTimeout);

describe('/models/jobComponent.js', () => {
  before((done) => {
    mongoose.connect(`mongodb://geoboom:${process.env.DB_PASS}@ds029595.mlab.com:29595/taskme-db-${process.env.NODE_ENV}`);
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error'));
    db.once('open', () => {
      console.log('connected to test db');
      done();
    });
  });

  it('should error if job component is blank', async () => {
    try {
      await JobComponent.createComponent();
    } catch (err) {
      expect(err.errors.component.message).to.equal('Component is required.');
    }
  });

  it('should error if job component has more than 20 characters', async () => {
    try {
      await JobComponent.createComponent('123456789123456789123'); // 9 + 9 + 3 = 21 characters
    } catch (err) {
      expect(err.errors.component.message).to.equal('Job component cannot have more than 20 characters.');
    }
  });

  const testComponent = 'test component';
  const sameComponent = testComponent;

  it('should return job component if save successful', async () => {
    try {
      const jobComponent = await JobComponent.createComponent(testComponent);
      expect(jobComponent.component).to.equal(testComponent);
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should return job component trimmed if trimmed(job component) != job component', async () => {
    try {
      const untrimmedComponent = '123456789123456789   ';
      const jobComponent = await JobComponent.createComponent(untrimmedComponent);
      expect(jobComponent.component).to.equal(untrimmedComponent.trim());
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should apiError if we attempt to save an already existing job component', async () => {
    try {
      await JobComponent.createComponent(sameComponent);
    } catch (err) {
      expect(err.status).to.equal(409);
      expect(err.message).to.equal('Component exists.');
    }
  });

  after(async () => {
    await JobComponent.remove({}).exec();
    const db = mongoose.connection;
    await db.close();
  });
});
