const Task = require('../models/task/Task');

exports.fileUploadPost = (req, res, next) => {
  try {
    req.file.originalname = decodeURIComponent(req.file.originalname);
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
    const { taskId, originalname } = req.params;
    const task = await Task.findOne({ _id: taskId }).exec();
    if (!task) res.status(404).send('Task not found.');

    const { path, originalname: filename } = (task.attachments || [])
      .find(({ originalname: o }) => (
        o === originalname
      ));
    res.download(path, filename, (err) => {
      if (err) {
        console.log('res.download error:', err);
        next(err);
      }
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};
