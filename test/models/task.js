/* eslint-disable no-console */
require('dotenv').config();
const { expect } = require('chai');
const mongoose = require('mongoose');

const { Task, Assignment } = require('../../models/task');
const Job = require('../../models/job');
const JobCategory = require('../../models/jobCategory');
const JobComponent = require('../../models/jobComponent');
const User = require('../../models/user');
const { initializeDB } = require('./dbHelper');

const sleep = require('util').promisify(setTimeout);

describe('/models/task.js', () => {
  before(initializeDB(mongoose));

  const JOB_TITLE = 'job title';
  const JOB_DESC = 'job desc';
  const JOB_CATEGORY = 'job category';
  const JOB_COMPONENT = 'job component';

  let taskWorker01Id;
  let taskWorker02Id;
  let taskWorker03Id;
  let nonTaskWorker01Id;
  let admin01Id;
  let jobId;

  let goodAssignment01;
  let goodAssignment02;
  let goodAssignment03;
  let badAssignment01;
  let badAssignment02;

  before(async () => {
    await Promise.all([
      JobComponent.remove({}).exec(),
      JobCategory.remove({}).exec(),
      Job.remove({}).exec(),
      Task.remove({}).exec(),
      User.remove({}).exec(),
    ]);
    await Promise.all([
      JobComponent.createComponent(JOB_COMPONENT),
      JobCategory.createCategory(JOB_CATEGORY),
      User.signup('worker01', 'abcD3fg$_xxd123'),
      User.signup('worker02', 'abcD3fg$_xxd123'),
      User.signup('worker03', 'abcD3fg$_xxd123'),
      User.signup('worker04', 'abcD3fg$_xxd123'),
      User.createAdmin('admin01', 'abcD3fg$_xxd123'),
    ]);
    const userObjects = await Promise.all([
      User.getAuthenticated('worker01', 'abcD3fg$_xxd123'),
      User.getAuthenticated('worker02', 'abcD3fg$_xxd123'),
      User.getAuthenticated('worker03', 'abcD3fg$_xxd123'),
      User.getAuthenticated('worker04', 'abcD3fg$_xxd123'),
      User.getAuthenticated('admin01', 'abcD3fg$_xxd123'),
    ]);

    taskWorker01Id = userObjects[0]._id;
    taskWorker02Id = userObjects[1]._id;
    taskWorker03Id = userObjects[2]._id;
    nonTaskWorker01Id = userObjects[3]._id;
    admin01Id = userObjects[4]._id;

    goodAssignment01 = Task.createAssignment({
      assignedTo: taskWorker01Id,
      assignedBy: admin01Id,
      isLeader: true,
    });
    goodAssignment02 = Task.createAssignment({
      assignedTo: taskWorker02Id,
      assignedBy: admin01Id,
      isLeader: false,
    });
    goodAssignment03 = Task.createAssignment({
      assignedTo: taskWorker03Id,
      assignedBy: admin01Id,
      isLeader: true,
    });
    badAssignment01 = Task.createAssignment({
      assignedTo: admin01Id,
      assignedBy: admin01Id,
      isLeader: true,
    });
    badAssignment02 = Task.createAssignment({
      assignedTo: taskWorker02Id,
      assignedBy: taskWorker02Id,
      isLeader: true,
    });

    await Job.createJob(JOB_TITLE, JOB_DESC, JOB_CATEGORY, JOB_COMPONENT);
    jobId = (await Job.findOne({ title: JOB_TITLE }).exec())._id;
  });

  const BAD_JOBID = new mongoose.Types.ObjectId();
  const BAD_USERID = new mongoose.Types.ObjectId();

  const GOOD_TITLE = 'task title';
  const BAD_TITLE_LONG = '123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789'; // >80 char
  const BAD_TITLE_BLANK = '';

  const GOOD_DESCRIPTION = 'task title';
  const BAD_DESCRIPTION_LONG = BAD_TITLE_LONG + BAD_TITLE_LONG + BAD_TITLE_LONG + BAD_TITLE_LONG;

  const GOOD_TYPE = 'Inspection';
  const BAD_TYPE = 'iuasdhsad';

  const GOOD_DUEON = new Date();

  let task01Id;
  let task02Id;

  // it('should error if task title is blank', async () => {
  //   try {
  //     await Task.createTask({
  //       jobId,
  //       title: BAD_TITLE_BLANK,
  //       description: GOOD_DESCRIPTION,
  //       type: GOOD_TYPE,
  //       dueOn: GOOD_DUEON,
  //     });
  //   } catch (err) {
  //     expect(err.errors.title.message).to.equal('Task title required.');
  //   }
  // });
  //
  // it('should error if task title is too long', async () => {
  //   try {
  //     await Task.createTask({
  //       jobId,
  //       title: BAD_TITLE_LONG,
  //       description: GOOD_DESCRIPTION,
  //       type: GOOD_TYPE,
  //       dueOn: GOOD_DUEON,
  //     });
  //   } catch (err) {
  //     expect(err.errors.title.message).to.equal('Task title cannot have more than 80 characters.');
  //   }
  // });
  //
  // it('should error if task description is too long', async () => {
  //   try {
  //     await Task.createTask({
  //       jobId,
  //       title: GOOD_TITLE,
  //       description: BAD_DESCRIPTION_LONG,
  //       type: GOOD_TYPE,
  //       dueOn: GOOD_DUEON,
  //     });
  //   } catch (err) {
  //     expect(err.errors.description.message).to.equal('Task description cannot have more than 200 characters.');
  //   }
  // });
  //
  // it('should error if parent job blank', async () => {
  //   try {
  //     await Task.createTask({
  //       title: GOOD_TITLE,
  //       description: BAD_DESCRIPTION_LONG,
  //       type: GOOD_TYPE,
  //       dueOn: GOOD_DUEON,
  //     });
  //   } catch (err) {
  //     expect(err.errors.jobId.message).to.equal('Parent job required.');
  //   }
  // });
  //
  // it('should error if parent job not found', async () => {
  //   try {
  //     await Task.createTask({
  //       jobId: BAD_JOBID,
  //       title: GOOD_TITLE,
  //       description: BAD_DESCRIPTION_LONG,
  //       type: GOOD_TYPE,
  //       dueOn: GOOD_DUEON,
  //     });
  //   } catch (err) {
  //     expect(err.errors.jobId.message).to.equal('Parent job does not exist.');
  //   }
  // });
  //
  // it('should error if due date blank', async () => {
  //   try {
  //     await Task.createTask({
  //       jobId,
  //       title: GOOD_TITLE,
  //       description: GOOD_DESCRIPTION,
  //       type: GOOD_TYPE,
  //     });
  //   } catch (err) {
  //     expect(err.errors.dueOn.message).to.equal('Task due date required.');
  //   }
  // });
  //
  // it('should error if type blank', async () => {
  //   try {
  //     await Task.createTask({
  //       jobId,
  //       title: GOOD_TITLE,
  //       description: GOOD_DESCRIPTION,
  //     });
  //   } catch (err) {
  //     expect(err.errors.type.message).to.equal('Task type required.');
  //   }
  // });
  //
  // it('should error if type bad', async () => {
  //   try {
  //     await Task.createTask({
  //       jobId,
  //       title: GOOD_TITLE,
  //       description: GOOD_DESCRIPTION,
  //       type: BAD_TYPE,
  //     });
  //   } catch (err) {
  //     expect(err.errors.type.message).to.equal(`\`${BAD_TYPE}\` is not a valid enum value for path \`type\`.`);
  //   }
  // });

  it('should return task object unassigned for good task (w/o assignments)', async () => {
    try {
      const task = await Task.createTask({
        jobId,
        title: GOOD_TITLE,
        description: GOOD_DESCRIPTION,
        type: GOOD_TYPE,
        dueOn: GOOD_DUEON,
      });

      task01Id = task._id;

      expect(task.jobId._id).to.equal(jobId);
      expect(task.title).to.equal(GOOD_TITLE);
      expect(task.description).to.equal(GOOD_DESCRIPTION);
      expect(task.type).to.equal(GOOD_TYPE);
      expect(task.dueOn).to.equal(GOOD_DUEON);
      expect(task.status).to.equal('Unassigned');
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should return updated task object upon successful first addAssignment', async () => {
    try {
      const oldTask = await Task.createTask({
        jobId,
        title: GOOD_TITLE,
        description: GOOD_DESCRIPTION,
        type: GOOD_TYPE,
        dueOn: GOOD_DUEON,
      });
      task02Id = oldTask._id;

      const task = await Task.addAssignment(task02Id, goodAssignment01);
      expect(task.assignments[0]).to.exist;
      expect(task.status).to.equal('Pending Leader Accept');
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should return updated task object upon successful second addAssignment', async () => {
    try {
      const task = await Task.addAssignment(task02Id, goodAssignment02);
      expect(task.assignments[0]).to.exist;
      expect(task.status).to.equal('Pending Leader Accept');
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should error if addAssignment has admin as assignedTo', async () => {
    try {
      await Task.addAssignment(task01Id, badAssignment01);
    } catch (err) {
      expect(err.errors['assignments.0.assignedTo'].message).to.equal('Invalid assignedTo user.');
    }
  });

  it('should error if addAssignment has worker as assignedBy', async () => {
    try {
      await Task.addAssignment(task01Id, badAssignment02);
    } catch (err) {
      expect(err.errors['assignments.0.assignedBy'].message).to.equal('Invalid assignedBy user.');
    }
  });

  it('should error if addAssignment results in assignments with more than 1 leader', async () => {
    try {
      await Task.addAssignment(task02Id, goodAssignment03);
    } catch (err) {
      expect(err.errors.assignments.message).to.equal('Task must have one leader only.');
    }
  });

  it('should error if addAssignment results in task being assigned to same person more than once', async () => {
    try {
      await Task.addAssignment(task02Id, goodAssignment02);
    } catch (err) {
      expect(err.errors.assignments.message).to.equal('Task cannot be assigned to the same person more than once.');
    }
  });

  it('should set first assignment to leader if first assignment is not leader', async () => {
    try {
      const task = await Task.addAssignment(task01Id, goodAssignment02);
      expect(task.assignments[0].isLeader).to.be.true;
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should return task object upon successful addWorkerActivity', async () => {
    try {
      const task = await Task.addWorkerActivity(task02Id, goodAssignment01.assignedTo, 'Accept');
      expect(task).to.exist;
    } catch (err) {
      console.log(err);
      throw err;
    }
  });

  it('should error if addWorkerActivity to task which does not exist', async () => {
    try {
      await Task.addWorkerActivity(new mongoose.Types.ObjectId(), goodAssignment01.assignedTo, 'Accept');
    } catch (err) {
      expect(err.message).to.equal('Task not found.');
    }
  });

  it('should error if addWorkerActivity to task to which user is not assigned', async () => {
    try {
      await Task.addWorkerActivity(task02Id, goodAssignment03.assignedTo, 'Accept');
    } catch (err) {
      expect(err.message).to.equal('Task not assigned to user.');
    }
  });

  after(async () => {
    await Promise.all([
      JobComponent.remove({}).exec(),
      JobCategory.remove({}).exec(),
      Job.remove({}).exec(),
      Task.remove({}).exec(),
      User.remove({}).exec(),
    ]);
    await mongoose.connection.close();
  });
});
