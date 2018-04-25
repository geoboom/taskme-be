module.exports = function ApiError(message, status = 500) {
  this.message = message;
  this.status = status;
};
