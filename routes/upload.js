const express = require('express');
const multer = require('multer');

const {
  refreshTokenAuthentication,
} = require('../middleware/authentication');
const {
  fileUploadPost,
  fileDownloadGet,
} = require('../controllers/fileUpload');
const {
  validateRefreshToken,
} = require('../services/authentication');

const router = express.Router();

const upload = multer({
  dest: 'uploads/',
  fileFilter: async (req, file, cb) => {
    try {
      req.locals = {};
      req.locals.user = await validateRefreshToken(req.body.refreshToken);
      cb(null, true);
    } catch (e) {
      console.log(e);
      cb(e);
    }
  },
});

router.post(
  '/upload',
  upload.single('taskAttachment'),
  fileUploadPost,
);

// TODO: accessToken authentication
router.get(
  '/download/:taskId/:originalname',
  fileDownloadGet,
);

module.exports = router;
