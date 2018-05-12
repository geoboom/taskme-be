const { destroyPresence, getAllPresence } = require('./services/connect');
const socketio = require('socket.io');

const {
  authenticationMiddleware,
} = require('./middleware/socket/testAuthentication');

const init = (server) => {
  const io = socketio(server);

  io.use(authenticationMiddleware);

  io.on('connection', async (socket) => {
    socket.emit('connection.success', {
      userId: socket.userId,
      username: socket.username,
    });

    try {
      const presence = await getAllPresence();
      socket.emit('users.presence', {
        presence
      });
    } catch (err) {
      throw new Error(err);
    }

    socket.broadcast.emit('user.connected', {
      userId: socket.userId,
      username: socket.username,
    });


    // socket.on('task.add');
    // socket.on('task.assign');

    socket.on('disconnect', async () => {
      try {
        await destroyPresence(socket);
      } catch (err) {
        throw new Error(err);
      }

      socket.broadcast.emit('user.disconnected', {
        userId: socket.userId,
        username: socket.username,
      });
    });
  });

  return io;
};

module.exports = init;

