const { Assignment } = require('../../models/task/assignment/Assignment');
const Task = require('../../models/task/Task');
const { getPresence } = require('../../services/socket');

const deleteRoom = (io, roomName) => {
  const room = io.sockets.adapter.rooms[roomName];
  if (room) {
    room.sockets.forEach((s) => {
      s.leave(room);
    });
  }
};

module.exports.getTask = (io, socket, path) => async (payload) => {
  try {
    const { d: { _id } } = payload;
    const task = await Task.findOne({ _id }).exec();
    socket.emit(`${path.path}`, { d: task });
  } catch (e) {
    socket.emit(`${path.path}.error`);
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
    tasks.forEach(({ _id }) => {
      socket.join(`room.task.${_id}`);
    });
    socket.emit(`${path.path}`, { d: tasks });
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
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    socket.to('room.group.admin').emit(
      'notif.addTask',
      {
        title: 'New Task',
        message: `Task ${_id} has been added.`,
      },
    );
  } catch (e) {
    const { i } = payload;
    socket.emit(`${path.path}.error`, { i });
  }
};

module.exports.editTask = (io, socket, path) => async (payload) => {
  try {
    const { d } = payload;
    const task = await Task.editTask(d);
    socket.emit(`${path.path}`, { d: task });
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    io.in(`room.task.${task._id}`).emit(`${path.root}`, { d: task });
    socket.to('room.group.admin').to(`room.task.${task._id}`).emit(
      'notif.editTask',
      {
        title: 'Task Edited',
        message: `Task ${task._id} has been edited.`,
      },
    );
  } catch (e) {
    const { d: { _id } } = payload;
    socket.emit(`${path.path}.error`, { d: { _id } });
  }
};

module.exports.removeTask = (io, socket, path) => async (payload) => {
  try {
    const { d: { _id } } = payload; // d: { _id: ... }
    await Task.removeTask(_id);
    socket.emit(`${path.path}`, { d: { _id } });
    io.in('room.group.admin').emit(`${path.root}`, { d: { _id, deleted: true } });
    io.in(`room.task.${_id}`).emit(`${path.root}`, { d: { _id, deleted: true } });
    socket.to('room.group.admin').to(`room.task.${_id}`).emit(
      'notif.removeTask',
      {
        title: 'Task Removed',
        message: `Task ${_id} has been removed.`,
      },
    );
    deleteRoom(io, `room.task.${_id}`);
  } catch (e) {
    console.log(e);
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};

module.exports.adminCompleteTask = (io, socket, path) => async (payload) => {
  try {
    const { d: { _id: taskId } } = payload;
    const { user: { _id: userId } } = socket;
    const task = await Task.adminCompleteTask(taskId, userId);
    socket.emit(`${path.path}`, { d: { _id: taskId } }); // for ack
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    io.in(`room.task.${taskId}`).emit(`${path.root}`, { d: task });
    deleteRoom(io, `room.task.${taskId}`);
  } catch (e) {
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};

module.exports.addAssignment = (io, socket, path) => async (payload) => {
  try {
    const { d: { taskId, assignedTo } } = payload;
    const { user: { _id: assignedBy } } = socket;
    const task = await Task.addAssignment(
      taskId,
      new Assignment({ assignedTo, assignedBy }),
    );
    socket.emit(`${path.path}`, { d: task });
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    io.in(`room.task.${taskId}`).emit(`${path.root}`, { d: task });
    socket.to('room.group.admin').to(`room.task.${taskId}`).emit(
      'notif.addAssignment',
      {
        title: 'Assignment Added',
        message: `${assignedTo} has been assigned to task ${taskId} by ${assignedBy}.`,
      },
    );
    const socketId = await getPresence(assignedTo);
    if (socketId) {
      const target = io.sockets.connected[socketId];
      target.join(`room.task.${taskId}`);
      target.emit(`${path.root}`, { d: task });
      target.emit(
        'notif.addAssignment',
        {
          title: 'New Assignment',
          message: `You have been assigned task ${taskId} by ${assignedBy}.`,
        },
      );
    } else {
      // push notification
    }
  } catch (e) {
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};

module.exports.removeAssignment = (io, socket, path) => async (payload) => {
  try {
    const { d: { taskId, assignedTo } } = payload;
    const task = await Task.removeAssignment(taskId, assignedTo);
    socket.emit(`${path.path}`, { d: task });
    const socketId = await getPresence(assignedTo);
    if (socketId) {
      const target = io.sockets.connected[socketId];
      target.leave(`room.task.${taskId}`);
      target.emit(`${path.root}`, { d: task });
      target.emit(
        'notif.removeAssignment',
        {
          title: 'Removed from Task',
          message: `You have been removed from ${taskId}.`,
        },
      );
    } else {
      // push notification
    }
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    io.in(`room.task.${taskId}`).emit(`${path.root}`, { d: task });
    socket.to('room.group.admin').to(`room.task.${taskId}`).emit(
      'notif.removeAssignment',
      {
        title: 'Assignment Removed',
        message: `${assignedTo} has been removed from ${taskId}.`,
      },
    );
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
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    const socketId = await getPresence(assignedTo);
    if (!socketId) {
      // push notification
    }
    io.in(`room.task.${taskId}`).emit(`${path.root}`, { d: task });
  } catch (e) {
    const { d: { taskId, assignedTo } } = payload;
    socket.emit(`${path.path}.error`, { d: { taskId, assignedTo } });
  }
};

module.exports.assignmentActivity = (io, socket, path) => async (payload) => {
  try {
    const { d: { taskId, activity } } = payload;
    const { user: { _id: userId } } = socket;
    const oldTask = await Task.findOne({ _id: taskId }).exec();
    const task = await Task.assignmentActivity(taskId, userId, activity);
    task.assignments.forEach((assignment) => {
      if (assignment.assignedTo.toString() === userId.toString()
        && assignment.deleted) {
        socket.leave(`room.task.${taskId}`);
      }
    });
    socket.emit(`${path.path}`, { d: task });
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    io.in(`room.task.${taskId}`).emit(`${path.root}`, { d: task });
    if (task.status !== oldTask.status) {
      socket.to('room.group.admin').to(`room.task.${taskId}`).emit(
        'notif.taskStatusChange',
        {
          title: 'Task Status Updated',
          message: `Task ${taskId}: ${oldTask.status} -> ${task.status}.`,
        },
      );
    }
  } catch (e) {
    const { d: { taskId } } = payload;
    socket.emit(`${path.path}.error`, { d: { taskId } });
  }
};

