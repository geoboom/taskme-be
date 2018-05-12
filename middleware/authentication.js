const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local');

const {
  JWT_OPTIONS,
} = require('../config');
const {
  validateRefreshToken,
} = require('../controllers/authentication');
const User = require('../models/user');

exports.refreshTokenAuthentication = async (req, res, next) => {
  try {
    await validateRefreshToken(req.body.refreshToken, req.body.userId);
    next();
  } catch (err) {
    next(err);
  }
};

const passportJwtConfig = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  algorithms: ['HS256'],
  jsonWebTokenOptions: JWT_OPTIONS,
};

passport.use(new JwtStrategy(passportJwtConfig, (payload, done) => {
  if (payload.userId) {
    return done(null, payload);
  }
  return done(null, false);
}));

passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.getAuthenticated(username, password);
    if (user) {
      return done(null, user);
    }

    // should have thrown error if no user object
    return done(null, false);
  } catch (err) {
    return done(err);
  }
}));
