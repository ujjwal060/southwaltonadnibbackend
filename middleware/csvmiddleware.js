const multer = require('multer');
const { S3 } = require('@aws-sdk/client-s3');
const path = require('path');

// S3 configuration
const s3 = new S3({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
  requestHandler: {
    ...new S3().config.requestHandler,
    connectionTimeout: 6000,
  },
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png/;
  const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedFileTypes.test(file.mimetype);

  if (mimeType && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, jpg, png) are allowed.'));
  }
};

// Multer storage configuration
const storage = multer.memoryStorage();
const uploadFiles = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'image') {
      imageFileFilter(req, file, cb);
    } else {
      const csvAllowedTypes = /csv/;
      const csvExtname = csvAllowedTypes.test(path.extname(file.originalname).toLowerCase());
      const csvMimeType = csvAllowedTypes.test(file.mimetype);
      if (csvMimeType && csvExtname) {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed for pricing files.'));
      }
    }
  },
  limits: { fileSize: 1024 * 1024 * 5 }, // 5 MB limit
}).fields([
  { name: 'dailyPricingFile', maxCount: 1 },
  { name: 'twoToFourDaysPricingFile', maxCount: 1 },
  { name: 'fiveToSevenDaysPricingFile', maxCount: 1 },
  { name: 'eightToTwentySevenDaysPricingFile', maxCount: 1 },
  { name: 'twentyEightPlusPricingFile', maxCount: 1 },
  { name: 'image', maxCount: 1 }, // New field for image
]);

// Middleware for uploading files to S3
const uploadFilesToS3 = async (req, res, next) => {
  uploadFiles(req, res, async (err) => {
    if (err) {
      return res.status(400).send(err.message);
    }

    try {
      const fileLocations = {};
      if (req.files) {
        for (const fileType in req.files) {
          const file = req.files[fileType][0];

          const params = {
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
          };

          await s3.putObject(params);
          fileLocations[fileType] = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`;
        }
      }

      req.fileLocations = fileLocations; // Store the URLs of the uploaded files
      next();
    } catch (uploadError) {
      return res.status(500).send(uploadError.message);
    }
  });
};

module.exports = {
  uploadFilesToS3,
};
