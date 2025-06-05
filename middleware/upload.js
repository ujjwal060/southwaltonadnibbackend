// middleware/upload.js
const multer = require('multer');

// Use memory storage to keep files in memory as Buffer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Export the upload middleware
module.exports = upload;
