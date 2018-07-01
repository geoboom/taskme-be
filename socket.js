const socketio = require('socket.io');

const socketRoutes = require('./routes/socket');
const authenticationMiddleware = require('./middleware/socket/authentication');
const setupRooms = require('./middleware/socket/setupRooms');
const { unregisterPresence } = require('./services/socket');

const init = (server) => {
  const io = socketio(server);

  io.use(authenticationMiddleware);
  io.use(setupRooms);
  io.on('connection', (socket) => {
    socketRoutes(io, socket);

    console.log('connected');

    socket.on('disconnect', async () => {
      console.log('disconnected');
      try {
        await unregisterPresence(socket);
      } catch (e) {
        console.log(e);
      }
    });
  });


  return io;
};

module.exports = init;

