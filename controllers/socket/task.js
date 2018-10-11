const { Assignment } = require('../../models/task/assignment/Assignment');
const Task = require('../../models/task/Task');
const { getPresence } = require('../../services/socket');
const {
  sendPushNotif,
} = require('../../services/pushNotification');
const { deleteRoom } = require('../../helpers/socketRooms');
const { V_TASK_COMPLETED } = require('../../models/task/constants/taskGraph');

exports.getTask = (io, socket, path) => async (payload) => {
  try {
    const { d: { _id } } = payload;
    const task = await Task.findOne({ _id }).exec();
    socket.emit(`${path.path}`, { d: task });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

exports.getAllTasks = (io, socket, path) => async () => {
  try {
    const tasks = await Task.getAllTasks();
    socket.emit(`${path.path}`, { d: tasks });
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};

exports.getAssignedTasks = (io, socket, path) => async () => {
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

exports.addTask = (io, socket, path) => async (payload) => {
  try {
    const { d, i } = payload;
    const task = await Task.addTask(d);
    const { _id } = task;
    socket.emit(`${path.path}`, { d: { _id }, i });
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    const notifData = {
      title: 'New Task',
      message: `Task ${_id} has been added.`,
    };
    socket.to('room.group.admin').emit(
      'notif.addTask',
      notifData,
    );
    await sendPushNotif(notifData, 'admin');
  } catch (e) {
    console.log(e);
    const { i } = payload;
    socket.emit(`${path.path}.error`, { i });
  }
};

exports.editTask = (io, socket, path) => async (payload) => {
  try {
    const { d } = payload;
    const task = await Task.editTask(d);
    socket.emit(`${path.path}`, { d: task });
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    io.in(`room.task.${task._id}`).emit(`${path.root}`, { d: task });
    const notifData = {
      title: 'Task Edited',
      message: `Task ${task._id} has been edited.`,
    };
    socket.to('room.group.admin').to(`room.task.${task._id}`).emit(
      'notif.editTask',
      notifData,
    );
    await sendPushNotif(notifData, 'admin');
  } catch (e) {
    const { d: { _id } } = payload;
    console.log(e);
    socket.emit(`${path.path}.error`, { d: { _id } });
  }
};

exports.removeTask = (io, socket, path) => async (payload) => {
  try {
    const { d: { _id } } = payload; // d: { _id: ... }
    await Task.removeTask(_id);
    socket.emit(`${path.path}`, { d: { _id } });
    io.in('room.group.admin').emit(`${path.root}`, { d: { _id, deleted: true } });
    io.in(`room.task.${_id}`).emit(`${path.root}`, { d: { _id, deleted: true } });
    const notifData = {
      title: 'Task Removed',
      message: `Task ${_id} has been removed.`,
    };
    socket.to('room.group.admin').to(`room.task.${_id}`).emit(
      'notif.removeTask',
      notifData,
    );
    deleteRoom(io, `room.task.${_id}`);
    await sendPushNotif(notifData, 'admin');
  } catch (e) {
    console.log(e);
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};

exports.adminCompleteTask = (io, socket, path) => async (payload) => {
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

exports.checklistCheck = (io, socket, path) => async (payload) => {
  try {
    const { d } = payload;
    const { user: { _id, group } } = socket;
    const canCheck = await Task.userCanChecklist(_id, d._id);

    if (group === 'admin' || canCheck) {
      const task = await Task.checklistCheck(d);
      io.in('room.group.admin').emit(`${path.root}`, { d: task });
      io.in(`room.task.${task._id}`).emit(`${path.root}`, { d: task });
    }
  } catch (e) {
    console.log('error:', e);
    const { d: { _id } } = payload;
    socket.emit(`${path.path}.error`, { d: { _id } });
  }
};

exports.addAssignment = (io, socket, path) => async (payload) => {
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
    const notifData = {
      title: 'Assignment Added',
      message: `${assignedTo} has been assigned to task ${taskId} by ${assignedBy}.`,
    };
    socket.to('room.group.admin').to(`room.task.${taskId}`).emit(
      'notif.addAssignment',
      notifData,
    );
    await sendPushNotif(notifData, 'admin');
    const socketId = await getPresence(assignedTo);
    const notifData2 = {
      title: 'New Assignment',
      message: `You have been assigned task ${taskId} by ${assignedBy}.`,
    };
    if (socketId) {
      const target = io.sockets.connected[socketId];
      target.join(`room.task.${taskId}`);
      target.emit(`${path.root}`, { d: task });
      target.emit(
        'notif.addAssignment',
        notifData2,
      );
    } else {
      await sendPushNotif(notifData2, '', assignedTo);
    }
  } catch (e) {
    const { d } = payload;
    socket.emit(`${path.path}.error`, { d });
  }
};

exports.removeAssignment = (io, socket, path) => async (payload) => {
  try {
    const { d: { taskId, assignedTo } } = payload;
    const task = await Task.removeAssignment(taskId, assignedTo);
    socket.emit(`${path.path}`, { d: { taskId, assignedTo } });
    const socketId = await getPresence(assignedTo);
    const notifData = {
      title: 'Removed from Task',
      message: `You have been removed from ${taskId}.`,
    };
    if (socketId) {
      const target = io.sockets.connected[socketId];
      target.leave(`room.task.${taskId}`);
      target.emit(`${path.root}`, { d: task });
      target.emit(
        'notif.removeAssignment',
        notifData,
      );
    } else {
      // push notification
      await sendPushNotif(notifData, '', assignedTo);
    }
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    io.in(`room.task.${taskId}`).emit(`${path.root}`, { d: task });
    const notifData2 = {
      title: 'Assignment Removed',
      message: `${assignedTo} has been removed from ${taskId}.`,
    };
    socket.to('room.group.admin').to(`room.task.${taskId}`).emit(
      'notif.removeAssignment',
      notifData2,
    );
    await sendPushNotif(notifData2, 'admin');
  } catch (e) {
    const { d: { taskId, assignedTo } } = payload;
    socket.emit(`${path.path}.error`, { d: { taskId, assignedTo } });
  }
};

exports.promoteAssignment = (io, socket, path) => async (payload) => {
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

exports.assignmentActivity = (io, socket, path) => async (payload) => {
  try {
    const { d: { taskId, activity } } = payload;
    const { user: { _id: userId } } = socket;
    const oldTask = await Task.findOne({ _id: taskId }).exec();
    const task = await Task.assignmentActivity(taskId, userId, activity);
    const toRemove = task.assignments.find(assignment =>
      assignment.assignedTo.toString() === userId.toString() && assignment.deleted);
    if (toRemove) socket.leave(`room.task.${taskId}`);

    socket.emit(`${path.path}`, { d: task });
    io.in('room.group.admin').emit(`${path.root}`, { d: task });
    io.in(`room.task.${taskId}`).emit(`${path.root}`, { d: task });

    if (task.status !== oldTask.status) {
      const notifData = {
        title: 'Task Status Updated',
        message: `Task ${taskId}: ${oldTask.status} -> ${task.status}.`,
      };
      socket.to('room.group.admin').to(`room.task.${taskId}`).emit(
        'notif.taskStatusChange',
        notifData,
      );
      await sendPushNotif(notifData, 'admin');
    }

    if (task.status === V_TASK_COMPLETED) deleteRoom(io, `room.task.${taskId}`);
  } catch (e) {
    const { d: { taskId } } = payload;
    socket.emit(`${path.path}.error`, { d: { taskId } });
  }
};

