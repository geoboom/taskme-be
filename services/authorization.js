module.exports.withAuthorization = (
  user,
  adminRequired,
  successCb,
  failureCb,
  authFunction = () => true,
) => {
  if ((!adminRequired || (adminRequired && user.group === 'admin'))
    && authFunction(user)) {
    return successCb;
  }

  return failureCb;
};
