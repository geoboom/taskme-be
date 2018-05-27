/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const mongoose = require('mongoose');

const JobCategory = require('../../models/jobCategory');
const { initializeDB } = require('./dbHelper');

const sleep = require('util').promisify(setTimeout);

describe('/models/jobCategory.js', () => {
  before(initializeDB(mongoose));

  it('should error if job category is blank', async () => {
    try {
      await JobCategory.addCategory();
    } catch (err) {
      expect(err.errors.category.message).to.equal('Category is required.');
    }
  });

  it('should error if job category has more than 20 characters', async () => {
    try {
      await JobCategory.addCategory('123456789123456789123'); // 9 + 9 + 3 = 21 characters
    } catch (err) {
      expect(err.errors.category.message).to.equal('Job category cannot have more than 20 characters.');
    }
  });

  const TEST_CATEGORY = 'test category';
  const CORRECT_CATEGORY = TEST_CATEGORY;

  it('should return job category if save successful', async () => {
    try {
      const jobCategory = await JobCategory.addCategory(TEST_CATEGORY);
      expect(jobCategory.category).to.equal(TEST_CATEGORY);
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should return job category trimmed if trimmed(job category) != job category', async () => {
    try {
      const UNTRIMMED_CATEGORY = '123456789123456789   ';
      const jobCategory = await JobCategory.addCategory(UNTRIMMED_CATEGORY);
      expect(jobCategory.category).to.equal(UNTRIMMED_CATEGORY.trim());
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should apiError if we attempt to save an already existing job category', async () => {
    try {
      await JobCategory.addCategory(CORRECT_CATEGORY);
    } catch (err) {
      expect(err.status).to.equal(409);
      expect(err.message).to.equal('Category exists.');
    }
  });

  after(async () => {
    await JobCategory.remove({}).exec();
    await mongoose.connection.close();
  });
});
