/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const mongoose = require('mongoose');

const Task = require('../../models/task');
const Job = require('../../models/job');
const JobCategory = require('../../models/jobCategory');
const JobComponent = require('../../models/jobComponent');
const User = require('../../models/user');
const { initializeDB } = require('./dbHelper');

const sleep = require('util').promisify(setTimeout);

describe('/models/task.js', () => {
  before(initializeDB(mongoose));

  it('should find tasks', async () => {
    try {
      const tasks = await Task.find({ 'assignments.assignedTo': mongoose.Types.ObjectId('5afdba869c084b00147ff5c1') }).exec();
      console.log(tasks);
    } catch (e){
      console.log(e);
    }
  });

  after(async () => {
    await mongoose.connection.close();
  });
});
