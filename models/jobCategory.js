const mongoose = require('mongoose');
const ApiError = require('../helpers/apiError');

const jobCategorySchema = mongoose.Schema({
  category: {
    type: String,
    trim: true,
    validate: [
      {
        validator: v => v.trim().length < 20,
        message: 'Job category cannot have more than 20 characters.',
      },
    ],
    required: 'Category is required.',
    unique: true,
  },
});

const reasons = jobCategorySchema.statics.apiErrors = {
  CATEGORY_EXISTS: new ApiError('Category exists.', 409),
};

jobCategorySchema.statics.createCategory = async function (category) {
  const duplicateCategory = await this.findOne({ category }).exec();
  if (duplicateCategory) {
    throw reasons.CATEGORY_EXISTS;
  }

  const jobCategory = new this({
    category,
  });

  return jobCategory.save();
};

module.exports = mongoose.model('JobCategory', jobCategorySchema);