/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const mongoose = require('mongoose');

const JobComponent = require('../../models/jobComponent');
const { initializeDB } = require('./dbHelper');

const sleep = require('util').promisify(setTimeout);

describe('/models/jobComponent.js', () => {
  before(initializeDB(mongoose));

  it('should error if job component is blank', async () => {
    try {
      await JobComponent.addComponent();
    } catch (err) {
      expect(err.errors.component.message).to.equal('Component is required.');
    }
  });

  it('should error if job component has more than 20 characters', async () => {
    try {
      await JobComponent.addComponent('123456789123456789123'); // 9 + 9 + 3 = 21 characters
    } catch (err) {
      expect(err.errors.component.message).to.equal('Job component cannot have more than 20 characters.');
    }
  });

  const TEST_COMPONENT = 'test component';
  const SAME_COMPONENT = TEST_COMPONENT;

  it('should return job component if save successful', async () => {
    try {
      const jobComponent = await JobComponent.addComponent(TEST_COMPONENT);
      expect(jobComponent.component).to.equal(TEST_COMPONENT);
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should return job component trimmed if trimmed(job component) != job component', async () => {
    try {
      const UNTRIMMED_COMPONENT = '123456789123456789   ';
      const jobComponent = await JobComponent.addComponent(UNTRIMMED_COMPONENT);
      expect(jobComponent.component).to.equal(UNTRIMMED_COMPONENT.trim());
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should apiError if we attempt to save an already existing job component', async () => {
    try {
      await JobComponent.addComponent(SAME_COMPONENT);
    } catch (err) {
      expect(err.status).to.equal(409);
      expect(err.message).to.equal('Component exists.');
    }
  });

  after(async () => {
    await JobComponent.remove({}).exec();
    await mongoose.connection.close();
  });
});
