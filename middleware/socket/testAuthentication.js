const {
  validateToken,
  registerPresence,
} = require('../../services/connect');

exports.authenticationMiddleware = async (socket, next) => {
  const { userId, username } = socket.handshake.query;

  try {
    socket.userId = userId;
    socket.username = username;
    if (!await registerPresence(socket)) {
      next(new Error('session.alreadyActive'));
      return;
    }

    next();
  } catch (err) {
    next(err);
  }
};
