// middleware/upload.js
const multer = require('multer');

// Set storage for uploaded files to save them on disk
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Set your upload directory here
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Set your filename
    }
});

// Create the upload middleware
const upload = multer({ storage: storage });

// Export the upload middleware
module.exports = upload;
