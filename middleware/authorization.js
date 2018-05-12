exports.userFromGroup = (group) => (
  (req, res, next) => {
    console.log(group);
    console.log(req.user);
    next();
  }
);
