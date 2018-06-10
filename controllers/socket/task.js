const { Task, Assignment } = require('../../models/task');

module.exports.addAssignment = (io, socket, path) => async (payload) => {
  try {
    const { d: { taskId, assignedTo } } = payload;
    const { user: { _id } } = socket;
    const assignment = new Assignment({ assignedTo, assignedBy: _id });
    const task = await Task.addAssignment(taskId, assignment);
    socket.emit(`${path.path}`, { d: task });
    io.emit(`${path.root}`, { d: task });
  } catch (e) {
    const { d: { taskId, assignedTo } } = payload;
    socket.emit(`${path.path}.error`, { d: { taskId, assignedTo } });
  }
};

module.exports.removeAssignment = (io, socket, path) => async (payload) => {
  try {
    const { d: { taskId, assignedTo } } = payload;
    const task = await Task.removeAssignment(taskId, assignedTo);
    socket.emit(`${path.path}`, { d: task });
    io.emit(`${path.root}`, { d: task });
  } catch (e) {
    const { d: { taskId, assignedTo } } = payload;
    socket.emit(`${path.path}.error`, { d: { taskId, assignedTo } });
  }
};

module.exports.promoteAssignment = (io, socket, path) => async (payload) => {
  try {
    const { d: { taskId, assignedTo } } = payload;
    const task = await Task.promoteAssignment(taskId, assignedTo);
    socket.emit(`${path.path}`, { d: task });
    io.emit(`${path.root}`, { d: task });
  } catch (e) {
    const { d: { taskId, assignedTo } } = payload;
    socket.emit(`${path.path}.error`, { d: { taskId, assignedTo } });
  }
};

module.exports.assignmentActivity = (io, socket, path) => async (payload) => {
  try {
    const { d: { taskId, activity } } = payload;
    const { user: { _id } } = socket;
    const task = await Task.assignmentActivity(taskId, _id, activity);
    socket.emit(`${path.path}`, { d: task });
    io.emit(`${path.root}`, { d: task });
  } catch (e) {
    console.log(e);
    const { d: { taskId } } = payload;
    socket.emit(`${path.path}.error`, { d: taskId });
  }
};

module.exports.getAllTasks = (io, socket, path) => async () => {
  try {
    const tasks = await Task.getAllTasks();
    socket.emit(`${path.path}`, { d: tasks });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

module.exports.getAssignedTasks = (io, socket, path) => async () => {
  try {
    const { user } = socket;
    const tasks = await Task.getAssignedTasks(user._id);
    socket.emit(`${path.path}`, { d: tasks });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

module.exports.adminCompleteTask = (io, socket, path) => async (payload) => {
  try {
    const { d } = payload; // d: { _id: ... }
    const { user } = socket;
    const task = await Task.adminCompleteTask(d, user._id);
    socket.emit(`${path.path}`, { d }); // for ack
    io.emit(`${path.root}`, { d: task });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

module.exports.addTask = (io, socket, path) => async (payload) => {
  try {
    const { d, i } = payload;
    const task = await Task.addTask(d);
    const { _id } = task;
    socket.emit(`${path.path}`, { d: { _id }, i });
    io.emit(`${path.root}`, { d: task });
  } catch (e) {
    const { i } = payload;
    console.log(e);
    socket.emit(`${path.path}.error`, { i });
  }
};

module.exports.editTask = (io, socket, path) => async (payload) => {
  try {
    const { d } = payload;
    const task = await Task.editTask(d);
    socket.emit(`${path.path}`, { d: task });
    io.emit(`${path.root}`, { d: task });
  } catch (e) {
    const { d: _id } = payload;
    socket.emit(`${path.path}.error`, { d: { _id } });
  }
};

module.exports.removeTask = (io, socket, path) => async (payload) => {
  try {
    const { d } = payload; // d: { _id: ... }
    await Task.removeTask(d);
    socket.emit(`${path.path}`, { d }); // set softDel: true on client-side
    io.emit(`${path.root}`, { d: { ...d, softDel: true } });
  } catch (e) {
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};
