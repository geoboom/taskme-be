module.exports.withAuthorization = (user, adminRequired, successCb, failureCb) => {
  if (!adminRequired || (adminRequired && user.group === 'admin')) {
    return successCb;
  }

  return failureCb;
};
