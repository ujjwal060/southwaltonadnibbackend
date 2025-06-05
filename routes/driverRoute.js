const express = require("express");
const Driver = require('../models/driverModel');
const {
  getFilteredBookings,
  updateBookingStatus,
  createDriver,
  assignDriverToBooking,
  getAllDrivers,
  getDriverBookings,
  getDriverById,
  updateDriverById,
  deleteDriver,
  getImage,
  driverLogin,
  driverLogout,
  getDriverHistoryBookings

} = require('../controllers/driverController');
const { verifyAdmin } = require('../middleware/verifyToken');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadToS3 } = require("../controllers/commonController");

router.post('/add', uploadToS3, verifyAdmin, createDriver);
router.get('/', verifyAdmin, getAllDrivers);
router.get('/:id', verifyAdmin, getDriverById);
router.put('/:id', uploadToS3, verifyAdmin, updateDriverById);
router.delete('/:id', verifyAdmin, deleteDriver);
router.get('/image/:filename', getImage);

// Driver Login
router.post('/login', verifyAdmin, driverLogin);

// Assign driver to a booking
router.post('/assignDriver', assignDriverToBooking);

// Get bookings assigned to a driver
router.get('/:driverId/bookings', getDriverBookings);
router.get('/history/:driverId/bookings', getDriverHistoryBookings);

router.put('/bookings/update-status', updateBookingStatus);
router.get('/GET/filtered-bookings', getFilteredBookings);

// Driver Logout
router.post('/logout', driverLogout);

module.exports = router;
