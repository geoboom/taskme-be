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
  let goodAssignmentObj01;
  let goodAssignmentObj02;
  let goodAssignmentObj03;
  let badAssignmentObj01;
  let badAssignmentObj02;
  before(async () => {
    await Promise.all([
      JobComponent.remove({}).exec(),
      JobCategory.remove({}).exec(),
      Job.remove({}).exec(),
      Task.remove({}).exec(),
      User.remove({}).exec(),
    ]);
    await Promise.all([
      JobComponent.addComponent(JOB_COMPONENT),
      JobCategory.addCategory(JOB_CATEGORY),
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
    goodAssignmentObj01 = {
      assignedTo: taskWorker01Id,
      assignedBy: admin01Id,
    };
    goodAssignmentObj02 = {
      assignedTo: taskWorker02Id,
      assignedBy: admin01Id,
    };
    goodAssignmentObj03 = {
      assignedTo: taskWorker03Id,
      assignedBy: admin01Id,
    };
    badAssignmentObj01 = {
      assignedTo: admin01Id,
      assignedBy: admin01Id,
    };
    badAssignmentObj02 = {
      assignedTo: taskWorker02Id,
      assignedBy: taskWorker02Id,
    };
    await Job.addJob({
      title: JOB_TITLE, description: JOB_DESC, category: JOB_CATEGORY, component: JOB_COMPONENT,
    });
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
  //     await Task.addTask({
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
  //     await Task.addTask({
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
  //     await Task.addTask({
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
  //     await Task.addTask({
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
  //     await Task.addTask({
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
  //     await Task.addTask({
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
  //     await Task.addTask({
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
  //     await Task.addTask({
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
      const task = await Task.addTask({
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
      const oldTask = await Task.addTask({
        jobId,
        title: GOOD_TITLE,
        description: GOOD_DESCRIPTION,
        type: GOOD_TYPE,
        dueOn: GOOD_DUEON,
      });
      task02Id = oldTask._id;
      const goodAssignment01 = new Assignment(goodAssignmentObj01);
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
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      const task = await Task.addAssignment(task02Id, goodAssignment02);
      expect(task.assignments[0]).to.exist;
      expect(task.status).to.equal('Pending Leader Accept');
    } catch (err) {
      console.log(err);
      throw err;
    }
  });
  it('should error if addAssignment has admin as assignedTo', (done) => {
    const badAssignment01 = new Assignment(badAssignmentObj01);
    Task.addAssignment(task01Id, badAssignment01)
      .catch((e) => {
        expect(e.errors['assignments.0.assignedTo'].message).to.equal('Invalid assignedTo user.');
        done();
      });
  });
  it('should error if addAssignment has worker as assignedBy', (done) => {
    const badAssignment02 = new Assignment(badAssignmentObj02);
    Task.addAssignment(task01Id, badAssignment02)
      .catch((e) => {
        expect(e.errors['assignments.0.assignedBy'].message).to.equal('Invalid assignedBy user.');
        done();
      });
  });
  it('should error if addAssignment results in task being assigned to same person more than once', (done) => {
    const goodAssignment02 = new Assignment(goodAssignmentObj02);
    Task.addAssignment(task02Id, goodAssignment02)
      .catch((e) => {
        expect(e.errors.assignments.message).to.equal('Task cannot be assigned to the same person more than once.');
        done();
      });
  });
  it('should set first assignment to leader if first assignment is not leader', async () => {
    try {
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      const task = await Task.addAssignment(task01Id, goodAssignment02);
      expect(task.assignments[0].isLeader).to.be.true;
    } catch (err) {
      console.log(err);
      throw err;
    }
  });
  it('should error if assignmentActivity to task which does not exist', (done) => {
    const goodAssignment01 = new Assignment(goodAssignmentObj01);
    Task.assignmentActivity(new mongoose.Types.ObjectId(), goodAssignment01.assignedTo, 'Accept')
      .catch((e) => {
        expect(e.message).to.equal('Task not found.');
        done();
      });
  });
  it('should error if assignmentActivity to task to which user is not assigned', (done) => {
    const goodAssignment03 = new Assignment(goodAssignmentObj03);
    Task.assignmentActivity(task02Id, goodAssignment03.assignedTo, 'Accept')
      .catch((e) => {
        expect(e.message).to.equal('Task not assigned to user.');
        done();
      });
  });
  it('should error if leader tries to add activity which is not permitted', (done) => {
    const goodAssignment01 = new Assignment(goodAssignmentObj01);
    Task.assignmentActivity(task02Id, goodAssignment01.assignedTo, 'Start')
      .catch((e) => {
        expect(e.message).to.equal('Activity not permitted.');
        done();
      });
  });
  it('should error if worker tries to add activity which is not permitted', (done) => {
    const goodAssignment02 = new Assignment(goodAssignmentObj02);
    Task.assignmentActivity(task02Id, goodAssignment02.assignedTo, 'Start')
      .catch((e) => {
        expect(e.message).to.equal('Activity not permitted.');
        done();
      });
  });
  it('should return task object with correct status and assignments if leader accepts task', async () => {
    try {
      const goodAssignment01 = new Assignment(goodAssignmentObj01);
      const task = await Task.assignmentActivity(task02Id, goodAssignment01.assignedTo, 'Accept');
      expect(task.status).to.equal('Not Started');
      expect(task.assignments.find(x => x.assignedTo.toString() === goodAssignment01.assignedTo.toString()).status).to.equal('Not Started');
    } catch (err) {
      console.log(err);
      throw err;
    }
  });
  it('should return correct task object if worker activity permitted', async () => {
    try {
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      const task = await Task.assignmentActivity(task02Id, goodAssignment02.assignedTo, 'Accept');
      expect(task.status).to.equal('Not Started');
      expect(task.assignments.find(x => x.assignedTo.toString() === goodAssignment02.assignedTo.toString()).status).to.equal('Not Started');
    } catch (err) {
      console.log(err);
      throw err;
    }
  });
  it('should return task object with correct status and assignments if leader starts task', async () => {
    try {
      const goodAssignment01 = new Assignment(goodAssignmentObj01);
      const task = await Task.assignmentActivity(task02Id, goodAssignment01.assignedTo, 'Start');
      expect(task.status).to.equal('In Progress');
      expect(task.assignments.find(x => x.assignedTo.toString() === goodAssignment01.assignedTo.toString()).status).to.equal('In Progress');
    } catch (err) {
      console.log(err);
      throw err;
    }
  });
  it('should return correct task object if worker activity permitted', async () => {
    try {
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      const task = await Task.assignmentActivity(task02Id, goodAssignment02.assignedTo, 'Start');
      expect(task.status).to.equal('In Progress');
      expect(task.assignments.find(x => x.assignedTo.toString() === goodAssignment02.assignedTo.toString()).status).to.equal('In Progress');
    } catch (err) {
      console.log(err);
      throw err;
    }
  });
  it('should return task object with correct status and assignments if leader marks complete task', async () => {
    try {
      const goodAssignment01 = new Assignment(goodAssignmentObj01);
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      const task = await Task.assignmentActivity(task02Id, goodAssignment01.assignedTo, 'Mark Complete');
      expect(task.status).to.equal('Completed');
      expect(task.completedBy.toString()).to.equal(goodAssignment01.assignedTo.toString());
      expect(task.assignments.find(x => x.assignedTo.toString() === goodAssignment01.assignedTo.toString()).status).to.equal('Completed');
      const workerActivityLog = task.assignments.find(x =>
        x.assignedTo.toString() === goodAssignment02.assignedTo.toString()).activityLog;
      expect(workerActivityLog[workerActivityLog.length - 1].activity).to.equal('Task End');
      expect(task.assignments.find(x => x.assignedTo.toString() === goodAssignment02.assignedTo.toString()).status).to.equal('Completed');
    } catch (err) {
      console.log(err);
      throw err;
    }
  });
  it('should return correct task object upon adding assignments', async () => {
    try {
      const goodAssignment01 = new Assignment(goodAssignmentObj01);
      const goodAssignment03 = new Assignment(goodAssignmentObj03);
      await Task.addAssignment(task01Id, goodAssignment01);
      const task = await Task.addAssignment(task01Id, goodAssignment03);
      expect(task.assignments.length).to.equal(3);
      expect(task.status).to.equal('Pending Leader Accept');
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  it('should return task object with correct assignments and reassigned leader if leader rejects task', async () => {
    try {
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      const task = await Task.assignmentActivity(task01Id, goodAssignment02.assignedTo, 'Reject');
      const oldLeaderAssignment = task.assignments.find(x =>
        x.assignedTo.toString() === goodAssignment02.assignedTo.toString());
      expect(oldLeaderAssignment.isLeader).to.equal(false);
      expect(oldLeaderAssignment.softDel).to.equal(true);
      const newLeaderAssignment = task.assignments.find(x => x.isLeader === true);
      expect(newLeaderAssignment).to.exist;
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  it('should return correct task object upon assigning task to worker who is softDeleted', async () => {
    try {
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      const task = await Task.addAssignment(task01Id, goodAssignment02);
      const reAssignedAssignment = task.assignments.find(x =>
        x.assignedTo.toString() === goodAssignment02.assignedTo.toString());
      expect(reAssignedAssignment.softDel).to.equal(false);
      expect(reAssignedAssignment.status).to.equal('Pending Accept');
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  it('should error if assign task to non-softDeleted worker', (done) => {
    const goodAssignment02 = new Assignment(goodAssignmentObj02);
    Task.addAssignment(task01Id, goodAssignment02)
      .catch((e) => {
        expect(e.errors.assignments.message).to.equal('Task cannot be assigned to the same person more than once.');
        done();
      });
  });
  it('should return task object with assignment softDeleted upon admin remove', async () => {
    try {
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      const task = await Task.removeAssignment(task01Id, goodAssignment02.assignedTo);
      expect(task.assignments[0].status).to.equal('Removed');
      expect(task.assignments[0].softDel).to.be.true;
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  it('should error if admin tries to remove already removed assignment', (done) => {
    const goodAssignment02 = new Assignment(goodAssignmentObj02);
    Task.removeAssignment(task01Id, goodAssignment02.assignedTo)
      .catch((e) => {
        expect(e.message).to.equal('Activity not permitted.');
        done();
      });
  });
  it('should return task object with status unassigned if all members removed', async () => {
    try {
      const goodAssignment01 = new Assignment(goodAssignmentObj01);
      const goodAssignment03 = new Assignment(goodAssignmentObj03);
      await Task.removeAssignment(task01Id, goodAssignment03.assignedTo);
      const task = await Task.removeAssignment(task01Id, goodAssignment01.assignedTo);
      expect(task.status).to.equal('Unassigned');
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  it('should return correct assignments upon promoting non-leader to leader', async () => {
    try {
      const goodAssignment01 = new Assignment(goodAssignmentObj01);
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      await Task.addAssignment(task01Id, goodAssignment01);
      await Task.addAssignment(task01Id, goodAssignment02);
      await Task.assignmentActivity(task01Id, goodAssignment01.assignedTo, 'Accept');
      await Task.assignmentActivity(task01Id, goodAssignment01.assignedTo, 'Start');
      const task = await Task.promoteAssignment(task01Id, goodAssignment02.assignedTo);
      const log01 = task.assignments[0].activityLog;
      const log02 = task.assignments[1].activityLog;
      expect(log01[log01.length - 1].activity).to.equal('Promoted to Leader');
      expect(log02[log02.length - 1].activity).to.equal('Demoted from Leader');
    } catch (e) {
      console.log(e);
      throw e;
    }
  });
  it('should error if attempt to promote leader', (done) => {
    const goodAssignment02 = new Assignment(goodAssignmentObj02);
    Task.promoteAssignment(task01Id, goodAssignment02.assignedTo)
      .catch((e) => {
        expect(e.message).to.equal('User is already leader.');
        done();
      });
  });
  it('should return correct task object upon admin complete task', async () => {
    try {
      const goodAssignment02 = new Assignment(goodAssignmentObj02);
      const newTask = await Task.adminCompleteTask(task01Id, goodAssignment02.assignedBy);
      expect(newTask.status).to.equal('Completed');
      expect(newTask.completedBy).to.equal(goodAssignment02.assignedBy);
    } catch (e) {
      console.log(e);
      throw e;
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
