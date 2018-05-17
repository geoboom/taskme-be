const { destroyPresence, getWsPresence } = require('./services/connect');
const socketio = require('socket.io');

const {
  authenticationMiddleware,
} = require('./middleware/socket/authentication');
const User = require('./models/user');
const Job = require('./models/job');
const JobCategory = require('./models/jobCategory');
const JobComponent = require('./models/jobComponent');
const Task = require('./models/task');

const init = (server) => {
  const io = socketio(server);

  io.use(authenticationMiddleware);

  io.on('connection', async (socket) => {
    const { user } = socket;
    console.log(`user ${user._id} connected`);
    socket.emit('connection.success', user);

    try {
      const users = await User.find({}).exec();
      socket.emit('user.all', users);
      const response = { categories: [], components: [] };
      response.categories = (await JobCategory.find({}).exec()).map(x => x.category);
      response.components = (await JobComponent.find({}).exec()).map(x => x.component);
      socket.emit('catAndCom.all', response);

      if (socket.user.group === 'admin') {
        const jobs = await Job.find({}).exec();
        socket.emit('job.all', jobs);
        const tasks = await Task.find({}).exec();
        socket.emit('task.all', tasks);
      }
    } catch (e) {
      socket.emit('error', e);
    }

    socket.broadcast.emit('user.connected', user);

    socket.on('sampleComponentsAndCategories.create', async () => {
      try {
        const sampleCategories = ['Electrical', 'Security', 'Agriculture'];
        const sampleComponents = ['Lights', 'Grass', 'Barriers'];
        const result = await Promise.all([
          ...sampleCategories.map(x => JobCategory.createCategory(x)),
          ...sampleComponents.map(x => JobComponent.createComponent(x)),
        ]);

        socket.emit('sampleComponentsAndCategories.create', result);
      } catch (e) {
        socket.emit('error', e);
      }
    });

    socket.on('job.add', async (data) => {
      if (socket.user.group === 'admin') {
        try {
          const job = await Job.createJob(data.title, data.description, data.category, data.component);
          socket.emit('job.add', job);
        } catch (e) {
          socket.emit('error', e);
        }
      }

      socket.emit('error', 'Not authorized.');
    });

    socket.on('job.task.add', async (data) => {
      if (socket.user.group === 'admin') {
        try {
          const task = await Task.createTask(data);
          socket.emit('job.task.add', task);
        } catch (e) {
          socket.emit('error', e);
        }
      }

      socket.emit('error', 'Not authorized.');
    });

    socket.on('job.task.assignments.add', async (data) => {
      if (socket.user.group === 'admin') {
        try {
          console.log(data);
          const task = await Task.addAssignment(
            data.taskId,
            Task.createAssignment({
              assignedTo: data.assignedTo,
              assignedBy: socket.user._id,
              isLeader: 0,
            }),
          );
          socket.emit('job.task.assignments.add', task);
          const wsPresence = await getWsPresence();
          io.to(wsPresence[data._id]).emit('job.task.assignments.add', task);
        } catch (e) {
          socket.emit('error', e);
        }
      }

      socket.emit('error', 'Not authorized.');
    });

    socket.on('disconnect', async () => {
      try {
        await destroyPresence(socket);
        console.log(`user ${socket.user._id} disconnected`);
      } catch (e) {
        socket.emit('error', e);
      }

      socket.broadcast.emit('user.disconnected', {
        user,
      });
    });
  });

  return io;
};

module.exports = init;

