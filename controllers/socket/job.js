const Task = require('../../models/task/Task');
const Job = require('../../models/job/Job');
const JobCategory = require('../../models/job/JobCategory');
const JobComponent = require('../../models/job/JobComponent');
const SavedJob = require('../../models/job/SavedJobs');
const { sendPushNotif } = require('../../services/pushNotification');
const { addTask } = require('./task');

exports.getJob = (io, socket, path) => async (payload) => {
  try {
    const { d: { _id } } = payload;
    const job = await Job.findOne({ _id }).exec();
    socket.emit(`${path.path}`, { d: job });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

exports.getAllJobs = (io, socket, path) => async () => {
  try {
    const jobs = await Job.getAllJobs();
    socket.emit(`${path.path}`, { d: jobs });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

const addJob = (io, socket, path) => async (payload) => {
  try {
    console.log(path);
    const { d, i } = payload;
    const job = await Job.addJob(d);
    const { _id } = job;
    socket.emit(`${path.path}`, { d: { _id }, i });
    io.in('room.group.admin').emit(`${path.root}`, { d: job });
    const notifData = {
      title: 'New Job',
      message: `Job ${_id} has been added.`,
    };
    socket.to('room.group.admin').emit(
      'notif.addJob',
      notifData,
    );
    await sendPushNotif(notifData, 'admin');
    return _id;
  } catch (e) {
    const { i } = payload;
    socket.emit(`${path.path}.error`, { i });
  }
};

exports.addJob = addJob;

exports.editJob = (io, socket, path) => async (payload) => {
  try {
    const { d } = payload;
    const job = await Job.editJob(d);
    socket.emit(`${path.path}`, { d: job });
    io.in('room.group.admin').emit(`${path.root}`, { d: job });
    const notifData = {
      title: 'Job Edited',
      message: `Job ${job._id} has been edited.`,
    };
    socket.to('room.group.admin').emit(
      'notif.editJob',
      notifData,
    );
    await sendPushNotif(notifData, 'admin');
  } catch (e) {
    console.log(e);
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d: { _id: d._id } });
  }
};

exports.removeJob = (io, socket, path) => async (payload) => {
  try {
    const { d: { _id } } = payload;
    await Job.removeJob(_id);
    socket.emit(`${path.path}`, { d: { _id } });
    io.in('room.group.admin').emit(`${path.root}`, { d: { _id, deleted: true } });
    const notifData = {
      title: 'Job Removed',
      message: `Job ${_id} has been removed.`,
    };
    socket.to('room.group.admin').emit(
      'notif.removeJob',
      notifData,
    );
    await sendPushNotif(notifData, 'admin');
  } catch (e) {
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};

exports.getAllCategories = (io, socket, path) => async () => {
  try {
    const jobCategories = await JobCategory.getAllCategories();
    socket.emit(`${path.path}`, { d: jobCategories });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

exports.addCategory = (io, socket, path) => async (payload) => {
  try {
    const { d, i } = payload; // d is data and i is sequence number
    const jobCategory = await JobCategory.addCategory(d);
    const { _id } = jobCategory;
    socket.emit(`${path.path}`, { d: { _id }, i }); // for ack
    io.in('room.group.admin').emit(`${path.root}`, { d: jobCategory });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

exports.removeCategory = (io, socket, path) => async (payload) => {
  try {
    const { d, i } = payload; // d is data and i is sequence number
    await JobCategory.removeCategory(d);
    socket.emit(`${path.path}`, { d, i }); // for ack
    io.in('room.group.admin').emit(`${path.root}`, { d: { ...d, deleted: true } });
  } catch (e) {
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};

exports.getAllComponents = (io, socket, path) => async () => {
  try {
    const jobComponents = await JobComponent.getAllComponents();
    socket.emit(`${path.path}`, { d: jobComponents });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

exports.addComponent = (io, socket, path) => async (payload) => {
  try {
    const { d, i } = payload; // d is data and i is sequence number
    const jobComponent = await JobComponent.addComponent(d);
    const { _id } = jobComponent;
    socket.emit(`${path.path}`, { d: { _id }, i }); // for ack
    io.in('room.group.admin').emit(`${path.root}`, { d: jobComponent }); // to emit only to admins
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

exports.removeComponent = (io, socket, path) => async (payload) => {
  try {
    const { d, i } = payload; // d is data and i is sequence number
    await JobComponent.removeComponent(d);
    socket.emit(`${path.path}`, { d, i }); // for ack
    io.in('room.group.admin').emit(`${path.root}`, { d: { ...d, deleted: true } });
  } catch (e) {
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};
exports.getAllSavedJobs = (io, socket, path) => async () => {
  try {
    const savedJobs = (await SavedJob.getAllSavedJobs() || [])
      .map(({
        _id, title, job, noTasks,
      }) => ({
        _id, title, job, noTasks,
      }));
    socket.emit(`${path.path}`, { d: savedJobs });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};
exports.saveJob = (io, socket, path) => async (payload) => {
  try {
    const { d, i } = payload;
    const savedJob = await SavedJob.saveJob(d); // title, jobId, savedJobId
    io.in('room.group.admin').emit(`${path.path}`, { d: savedJob });
  } catch (e) {
    const { d } = payload;
    console.log('job save error:', e);
    socket.emit(`${path.path}.error`, { d });
  }
};
exports.removedSavedJob = (io, socket, path) => async (payload) => {
  try {
    const { d, i } = payload;
    await SavedJob.removeSavedJob(d);
    io.in('room.group.admin').emit(`${path.path}`, { d });
  } catch (e) {
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};

exports.deploySavedJob = (io, socket, path) => async (payload) => {
  try {
    const { d } = payload;
    const { job, tasks } = await SavedJob.getSavedJob(d);
    const addedJob = await Job.addJob(job);
    io.in('room.group.admin').emit('job', { d: addedJob });
    const results = [];
    for (let i = 0; i < tasks.length; i += 1) {
      results.push(Task.addTask({ ...tasks[i], jobId: addedJob._id }));
    }
    (await Promise.all(results)).forEach((addedTask) => {
      io.in('room.group.admin').emit('task', { d: addedTask });
    });
  } catch (e) {
    const { d } = payload;
    console.log(e);
    socket.emit(`${path.path}.error`, { d });
  }
};

