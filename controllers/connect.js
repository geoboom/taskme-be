const {
  storeToken,
} = require('../services/connect');

exports.rootGet = async (req, res, next) => {
  try {
    const token = await storeToken(req.user);
    res.json({
      e: 'Token generated.',
      d: {
        tok: token,
      },
    });
  } catch (err) {
    next(err);
  }
};
