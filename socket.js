const socketio = require('socket.io');

const socketRoutes = require('./routes/socket');
const authenticationMiddleware = require('./middleware/socket/authentication');

const init = (server) => {
  const io = socketio(server);

  io.use(authenticationMiddleware);
  io.on('connection', (socket) => {
    socketRoutes(socket);
  });

  return io;
};

module.exports = init;

