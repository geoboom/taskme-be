const { withAuthorization } = require('../../services/authorization');
const jobRoutes = require('./job');
const taskRoutes = require('./task');
const userRoutes = require('./user');

const socketAuthorizationFailure = (io, socket, path) => () => {
  socket.emit(`${path}.authorization.failure`);
};

module.exports = (io, socket) => {
  jobRoutes.forEach(route => {
    socket.on(
      route.path.path,
      withAuthorization(
        socket.user,
        route.adminRequired,
        route.handler,
        socketAuthorizationFailure,
      )(io, socket, route.path),
    )
  });

  taskRoutes.forEach(route => {
    socket.on(
      route.path.path,
      withAuthorization(
        socket.user,
        route.adminRequired,
        route.handler,
        socketAuthorizationFailure,
      )(io, socket, route.path),
    )
  });

  userRoutes.forEach(route => {
    socket.on(
      route.path.path,
      withAuthorization(
        socket.user,
        route.adminRequired,
        route.handler,
        socketAuthorizationFailure,
      )(io, socket, route.path),
    )});
};
