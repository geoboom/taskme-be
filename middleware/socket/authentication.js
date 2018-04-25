const {
  validateToken,
  registerPresence,
} = require('../../controllers/connect');
const {
  getUserSession,
} = require('../../controllers/user');


exports.authenticationMiddleware = async (socket, next) => {
  const { tok } = socket.handshake.query;

  try {
    const sessionId = await validateToken(tok);
    if (!sessionId) {
      return next(new Error('session.authenticationFailed'));
    }

    const userSession = await getUserSession(sessionId);
    if (!userSession) {
      return next(new Error('session.notFound'));
    }

    const { userId } = JSON.parse(userSession);
    socket.userId = userId;
    if (!await registerPresence(socket)) {
      return next(new Error('session.alreadyActive'));
    }

    next();
  } catch (err) {
    next(err);
  }
};
