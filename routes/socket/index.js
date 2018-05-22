const withAuthorization = require('../../services/authorization');
const jobRoutes = require('./job').map(route => ({ ...route, path: `job${route.path}` }));
const taskRoutes = require('./task').map(route => ({ ...route, path: `task${route.path}` }));

const socketAuthorizationFailure = (socket, path) => {
  socket.emit(`${path}.authorization.failure`);
};

module.exports = (socket) => {
  jobRoutes.map(route =>
    socket.on(
      route.path,
      withAuthorization(
        socket.user,
        route.adminRequired,
        route.handler,
        socketAuthorizationFailure,
      )(socket, route.path),
    ));

  taskRoutes.map(route =>
    socket.on(
      route.path,
      withAuthorization(
        socket.user,
        route.adminRequired,
        route.handler,
        socketAuthorizationFailure,
      )(socket),
    ));
};
