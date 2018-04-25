const users = {
  userData: {},
};

users.__proto__ = {
  addUser: function addUser(username, password) {
    if (this.userData[username]) {
      throw new Error('Username already exists.');
    }

    // TODO: check if username is valid
    this.userData[username] = {
      password,
    };
  },

  validateUser: function validateUser(username, password) {
    if (!this.userData[username]) {
      return false;
    }

    return this.userData[username].password === password;
  },
};

module.exports = users;
