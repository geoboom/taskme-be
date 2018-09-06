const mongoose = require('mongoose');
const ApiError = require('../../helpers/apiError');

const jobComponentSchema = mongoose.Schema({
  component: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length < 20,
        message: 'Job component cannot have more than 20 characters.',
      },
    ],
    required: 'Component is required.',
    unique: true,
  },
});

const reasons = jobComponentSchema.statics.apiErrors = {
  COMPONENT_EXISTS: new ApiError('Component exists.', 409),
};

jobComponentSchema.statics.getAllComponents = async function () {
  const components = await this.find({}).exec();

  return components;
};

jobComponentSchema.statics.addComponent = async function ({ component }) {
  const duplicateComponent = await this.findOne({ component }).exec();
  if (duplicateComponent) {
    throw reasons.COMPONENT_EXISTS;
  }

  const jobComponent = new this({
    component,
  });

  return jobComponent.save();
};

jobComponentSchema.statics.removeComponent = async function({ _id }) {
  const removedComponent = await this.deleteOne({ _id }).exec();

  return removedComponent;
};

module.exports = mongoose.model('JobComponent', jobComponentSchema);
