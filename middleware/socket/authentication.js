const jwt = require('jsonwebtoken');

const { registerPresence } = require('../../services/socket');

module.exports = async (socket, next) => {
  const { tok } = socket.handshake.query;

  try {
    socket.user = await jwt.verify(tok, process.env.JWT_SECRET);

    const response = await registerPresence(socket);
    if (!response) {
      return next(new Error('Session already active.'));
    }
    return next();
  } catch (err) {
    return next(new Error('Authentication error.'));
  }
};
