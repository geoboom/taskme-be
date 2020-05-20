/* eslint-disable no-param-reassign */
const jwt = require('jsonwebtoken');

const { registerPresence } = require('../../services/socket');

module.exports = async (socket, next) => {
  const { tok } = socket.handshake.query;

  try {
    console.log('auth attempt:', socket.id);
    socket.user = await jwt.verify(tok, process.env.JWT_SECRET);

    const response = await registerPresence(socket);
    if (!response) {
      return next(new Error(JSON.stringify({
        type: 'authentication',
        message: 'Session already active',
      })));
    }
    return next();
  } catch (err) {
    return next(new Error(JSON.stringify({
      type: 'authentication',
      message: 'Authentication error',
    })));
  }
};
