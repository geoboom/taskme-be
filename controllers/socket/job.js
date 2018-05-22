const Job = require('../../models/job');
const JobCategory = require('../../models/jobCategory');
const JobComponent = require('../../models/jobComponent');

module.exports.getAllCategories = (socket, path) => async () => {
  try {
    const jobCategories = await JobCategory.getAllCategories();
    socket.emit(`${path}`, jobCategories);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.addCategory = (socket, path) => async (payload) => {
  try {
    const jobCategory = await JobCategory.addCategory(payload);
    socket.emit(`${path}`, jobCategory);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.removeCategory = (socket, path) => async (payload) => {
  try {
    const jobCategory = await JobCategory.removeCategory(payload);
    socket.emit(`${path}`, jobCategory);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.getAllComponents = (socket, path) => async () => {
  try {
    const jobComponents = await JobComponent.getAllComponents();
    socket.emit(`${path}`, jobComponents);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.addComponent = (socket, path) => async (payload) => {
  try {
    const jobComponent = await JobComponent.addComponent(payload);
    socket.emit(`${path}`, jobComponent);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.removeComponent = (socket, path) => async (payload) => {
  try {
    const jobComponent = await JobComponent.removeComponent(payload);
    socket.emit(`${path}`, jobComponent);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.getAllJobs = (socket, path) => async () => {
  try {
    const jobs = await Job.getAllJobs();
    socket.emit(`${path}`, jobs);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.addJob = (socket, path) => async (payload) => {
  try {
    const job = await Job.addJob(payload);
    socket.emit(`${path}`, job);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.editJob = (socket, path) => async (payload) => {
  try {
    const job = await Job.editJob(payload);
    socket.emit(`${path}`, job);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.removeJob = (socket, path) => async (payload) => {
  try {
    const job = await Job.removeJob(payload);
    socket.emit(`${path}`, job);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};
