const { destroyPresence } = require('./controllers/connect');
const socketio = require('socket.io');

const {
  authenticationMiddleware,
} = require('./middleware/socket/authentication');

const init = (server) => {
  const io = socketio(server);

  io.use(authenticationMiddleware);

  io.on('connection', (socket) => {
    console.log(`socket.userId ${socket.userId} connected`);
    socket.emit('connection.success', {
      userId: socket.userId,
    });

    console.log(socket.rooms);
    socket.join('main.lobby', () => {
      console.log(socket.rooms);
    });

    socket.on('disconnect', () => {
      console.log(`socket.userId ${socket.userId} disconnected`);
      destroyPresence(socket);
    });
  });

  return io;
};

module.exports = init;

