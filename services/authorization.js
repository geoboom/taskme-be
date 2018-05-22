module.exports.withAuthorization = (user, adminRequired, successCb, failureCb) => {
  if (adminRequired && user.group === 'Admin') {
    return successCb;
  }

  return failureCb;
};
