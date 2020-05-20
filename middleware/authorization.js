exports.userFromGroup = (group) => (
  (req, res, next) => {
    console.log(res.locals.user);
    next();
  }
);
