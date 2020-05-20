const Task = require('../../models/task/Task');

module.exports = async (socket, next) => {
  // user already authenticated
  const { user: { _id: userId, group } } = socket;

  socket.join(`room.group.${group}`);
  if (group === 'standard') {
    const tasks = await Task.getAssignedTasks(userId);
    tasks.forEach((task) => {
      socket.join(`room.task.${task._id}`);
    });
  }
  next();
};
