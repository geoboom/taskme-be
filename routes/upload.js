const express = require('express');
const multer = require('multer');

const {
  refreshTokenAuthentication,
} = require('../middleware/authentication');

const upload = multer({ dest: 'uploads/' });

const {
  userFromGroup,
} = require('../middleware/authorization');
const {
  fileUploadPost,
} = require('../controllers/fileUpload');

const router = express.Router();

router.post(
  '/upload',
  upload.single('taskAttachment'),
  fileUploadPost,
);

module.exports = router;
