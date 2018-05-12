const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const ApiError = require('../helpers/apiError');

const SALT_WORK_FACTOR = 10;
const MAX_LOGIN_ATTEMPS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000;

// const userTaskSchema = mongoose.Schema({
// {
//   taskId: {
//
//   },
//   status: {
//
//   },
//   isLeader: {
//
//   },
//   activity: [
//     activityType: {
//
// },
//   timestamp: {
//
//   },
// ],
// }
// });

const userSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  username: {
    type: String,
    validate: {
      validator: v => /^[a-zA-Z0-9_-]{6,15}$/.test(v),
      message: '{VALUE} is not a valid username.',
    },
    required: 'Username is required.',
    unique: true,
  },
  password: {
    type: String,
    validate: {
      validator: v => /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{10,128}$/.test(v),
      message: 'Password must contain at least 10 characters, with at least one upper case letter,' +
      'at least one lowercase letter, at least one number and at least one special character',
    },
    required: 'Password is required.',
  },
  group: {
    type: String,
    enum: ['admin', 'worker'],
    default: 'worker',
    required: 'Group is required.',
  },
  // taskList: [userTaskSchema],
  lastLoginTimestamp: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  lockUntil: {
    type: Number,
  },
}, {
  timestamps: {
    createdAt: 'signupTimestamp',
  },
});

userSchema.pre('save', function (next) {
  const user = this;

  if (!user.isModified('password')) {
    next();
    return;
  }

  bcrypt.genSalt(SALT_WORK_FACTOR, (err, salt) => {
    if (err) {
      next(err);
      return;
    }

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) {
        next(err);
        return;
      }

      user.password = hash;
      next();
    });
  });
});

const reasons = userSchema.statics.failedLogin = {
  USERNAME_OR_PASSWORD_INCORRECT: new ApiError('Wrong username or password.', 401),
  MAX_ATTEMPTS: new ApiError('Account temporarily locked.', 403),
};

userSchema.virtual('isLocked').get(function () {
  return (this.lockUntil && this.lockUntil > Date.now());
});

userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.update({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.update(updates);
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.getAuthenticated = async function (username, password) {
  const user = await this.findOne({ username }).exec();
  if (!user) throw reasons.USERNAME_OR_PASSWORD_INCORRECT;
  if (user.isLocked) {
    await user.incLoginAttempts;
    throw reasons.MAX_ATTEMPTS;
  }

  // user is not locked
  const match = await user.comparePassword(password);
  if (match) {
    if (!user.loginAttempts && !user.lockUntil) return user;

    const updates = {
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 },
    };

    await user.update(updates);
    return user;
  }

  // password incorrect
  await user.incLoginAttempts();
  throw reasons.USERNAME_OR_PASSWORD_INCORRECT;
};


module.exports = mongoose.model('User', userSchema);
