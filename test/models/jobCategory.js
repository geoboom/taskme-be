/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const mongoose = require('mongoose');

const JobCategory = require('../../models/jobCategory');
const sleep = require('util').promisify(setTimeout);

describe('/models/jobCategory.js', () => {
  before((done) => {
    mongoose.connect(`mongodb://geoboom:${process.env.DB_PASS}@ds029595.mlab.com:29595/taskme-db-${process.env.NODE_ENV}`);
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error'));
    db.once('open', () => {
      console.log('connected to test db');
      done();
    });
  });

  it('should error if job category is blank', async () => {
    try {
      await JobCategory.createCategory();
    } catch (err) {
      expect(err.errors.category.message).to.equal('Category is required.');
    }
  });

  it('should error if job category has more than 20 characters', async () => {
    try {
      await JobCategory.createCategory('123456789123456789123'); // 9 + 9 + 3 = 21 characters
    } catch (err) {
      expect(err.errors.category.message).to.equal('Job category cannot have more than 20 characters.');
    }
  });

  const testCategory = 'test category';
  const sameCategory = testCategory;

  it('should return job category if save successful', async () => {
    try {
      const jobCategory = await JobCategory.createCategory(testCategory);
      expect(jobCategory.category).to.equal(testCategory);
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should return job category trimmed if trimmed(job category) != job category', async () => {
    try {
      const untrimmedCategory = '123456789123456789   ';
      const jobCategory = await JobCategory.createCategory(untrimmedCategory);
      expect(jobCategory.category).to.equal(untrimmedCategory.trim());
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should apiError if we attempt to save an already existing job category', async () => {
    try {
      await JobCategory.createCategory(sameCategory);
    } catch (err) {
      expect(err.status).to.equal(409);
      expect(err.message).to.equal('Category exists.');
    }
  });

  after(async () => {
    await JobCategory.remove({}).exec();
    const db = mongoose.connection;
    await db.close();
  });
});
