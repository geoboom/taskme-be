const jwt = require('jsonwebtoken');

const {
  registerPresence,
} = require('../../services/connect');

exports.authenticationMiddleware = async (socket, next) => {
  const { tok } = socket.handshake.query;

  try {
    const payload = await jwt.verify(tok, process.env.JWT_SECRET);

    socket.user = payload;

    // if (!await registerPresence(socket)) {
    //   next(new Error('session.alreadyActive'));
    //   return;
    // }

    // presence registered in ws-presence key redis hashmap
    next();
  } catch (err) {
    next(err);
  }
};
