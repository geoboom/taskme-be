const { Task, Assignment } = require('../../models/task');

module.exports.addAssignment = (socket, path) => async (payload) => {
  try {
    const { taskId, userId } = payload;
    const { user } = socket;
    const assignment = new Assignment({ assignedTo: userId, assignedBy: user._id });
    const task = await Task.addAssignment(taskId, assignment);
    socket.emit(`${path}`, task);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.removeAssignment = (socket, path) => async (payload) => {
  try {
    const { taskId, userId } = payload;
    const task = await Task.removeAssignment(taskId, userId);
    socket.emit(`${path}`, task);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.promoteAssignment = (socket, path) => async (payload) => {
  try {
    const { taskId, userId } = payload;
    const task = await Task.promoteAssignment(taskId, userId);
    socket.emit(`${path}`, task);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.assignmentActivity = (socket, path) => async (payload) => {
  try {
    const { taskId, activity } = payload;
    const { user } = socket;
    const task = await Task.assignmentActivity(taskId, user._id, activity);
    socket.emit(`${path}`, task);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.getAllTasks = (socket, path) => async () => {
  try {
    const tasks = await Task.getAllTasks();
    socket.emit(`${path}`, tasks);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.addTask = (socket, path) => async (payload) => {
  try {
    const task = await Task.addTask(payload);
    socket.emit(`${path}`, task);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.getAssignedTasks = (socket, path) => async () => {
  try {
    const { user } = socket;
    const tasks = await Task.getAssignedTasks(user._id);
    socket.emit(`${path}`, tasks);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.editTask = (socket, path) => async (payload) => {
  try {
    const task = await Task.editTask(payload);
    socket.emit(`${path}`, task);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.removeTask = (socket, path) => async (payload) => {
  try {
    const task = await Task.removeTask(payload);
    socket.emit(`${path}`, task);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};

module.exports.adminCompleteTask = (socket, path) => async (payload) => {
  try {
    const { user } = socket;
    const task = await Task.adminCompleteTask(payload, user._id);
    socket.emit(`${path}`, task);
  } catch (e) {
    socket.emit(`${path}.error`);
  }
};
