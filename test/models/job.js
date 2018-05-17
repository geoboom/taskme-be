/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const mongoose = require('mongoose');

const Job = require('../../models/job');
const JobCategory = require('../../models/jobCategory');
const JobComponent = require('../../models/jobComponent');
const { initializeDB } = require('./dbHelper');

const sleep = require('util').promisify(setTimeout);

describe('/models/job.js', () => {
  before(initializeDB(mongoose));

  const TEST_CATEGORY = 'test category';
  const TEST_COMPONENT = 'test component';

  before(async () => {
    await Promise.all([
      JobComponent.remove({}).exec(),
      JobCategory.remove({}).exec(),
      Job.remove({}).exec(),
    ]);
    await Promise.all([
      JobComponent.createComponent(TEST_COMPONENT),
      JobCategory.createCategory(TEST_CATEGORY),
    ]);
  });

  const CORRECT_CATEGORY = TEST_CATEGORY;
  const CORRECT_COMPONENT = TEST_COMPONENT;
  const WRONG_CATEGORY = 'wrong category';
  const WRONG_COMPONENT = 'wrong component';

  const GOOD_TITLE = 'good title';
  const BAD_TITLE = '123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789';
  const GOOD_DESC = 'good desc';
  const BAD_DESC = BAD_TITLE + BAD_TITLE + BAD_TITLE;

  it('should error if job title is blank', async () => {
    try {
      await Job.createJob('', GOOD_DESC, CORRECT_CATEGORY, CORRECT_COMPONENT);
    } catch (err) {
      expect(err.errors.title.message).to.equal('Job title required.');
    }
  });

  it('should error if job title is too long', async () => {
    try {
      await Job.createJob(BAD_TITLE, GOOD_DESC, CORRECT_CATEGORY, CORRECT_COMPONENT);
    } catch (err) {
      expect(err.errors.title.message).to.equal('Job title cannot have more than 80 characters.');
    }
  });

  it('should error if job desc is too long', async () => {
    try {
      await Job.createJob(GOOD_TITLE, BAD_DESC, CORRECT_CATEGORY, CORRECT_COMPONENT);
    } catch (err) {
      expect(err.errors.description.message).to.equal('Job description cannot have more than 200 characters.');
    }
  });

  it('should error if job category not found', async () => {
    try {
      const job = await Job.createJob(GOOD_TITLE, GOOD_DESC, WRONG_CATEGORY, CORRECT_COMPONENT);
      console.log(job);
    } catch (err) {
      expect(err.errors.category.message).to.equal('Category does not exist.');
    }
  });

  it('should error if job component not found', async () => {
    try {
      const job = await Job.createJob(GOOD_TITLE, GOOD_DESC, CORRECT_CATEGORY, WRONG_COMPONENT);
      console.log(job);
    } catch (err) {
      expect(err.errors.component.message).to.equal('Component does not exist.');
    }
  });

  it('should create and return job object successfully if all fields are valid', async () => {
    try {
      const job = await Job.createJob(GOOD_TITLE, GOOD_DESC, CORRECT_CATEGORY, CORRECT_COMPONENT);
      expect(job.title).to.equal(GOOD_TITLE);
      expect(job.description).to.equal(GOOD_DESC);
      expect(job.category).to.equal(CORRECT_CATEGORY);
      expect(job.component).to.equal(CORRECT_COMPONENT);
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should create and return job object successfully if all fields are valid with blank desc', async () => {
    try {
      const job = await Job.createJob(GOOD_TITLE, '', CORRECT_CATEGORY, CORRECT_COMPONENT);
      expect(job.title).to.equal(GOOD_TITLE);
      expect(job.description).to.equal('');
      expect(job.category).to.equal(CORRECT_CATEGORY);
      expect(job.component).to.equal(CORRECT_COMPONENT);
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should create and return job object successfully if all fields are valid with undefined desc', async () => {
    try {
      const job = await Job.createJob(GOOD_TITLE, undefined, CORRECT_CATEGORY, CORRECT_COMPONENT);
      expect(job.title).to.equal(GOOD_TITLE);
      expect(job.description).to.not.exist;
      expect(job.category).to.equal(CORRECT_CATEGORY);
      expect(job.component).to.equal(CORRECT_COMPONENT);
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  after(async () => {
    await Promise.all([
      JobComponent.remove({}).exec(),
      JobCategory.remove({}).exec(),
      Job.remove({}).exec(),
    ]);
    await mongoose.connection.close();
  });
});
