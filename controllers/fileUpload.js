exports.fileUploadPost = async (req, res, next) => {
  try {
    res.json({
      uploadData: req.file,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

exports.fileDownloadGet = async (req, res, next) => {
  try {
    // read file then pipe file to response
  } catch(e) {

  }
};
