const User = require('../../models/user');

module.exports.getAllUsers = (io, socket, path) => async () => {
  try {
    const users = await User.find({}).exec(); // TODO: create static method

    socket.emit(`${path.path}`, { d: users.map(user => {
          const { _id, username, group } = user;
          return ({
            _id,
            username,
            group,
          });
        })});
  } catch (e) {
    socket.emit(`${path.path}.error`);
  }
};
