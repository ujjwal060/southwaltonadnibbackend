const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');

router.get('/driver/:driverId/bookings', taskController.getBookingsForDriver);


module.exports = router;
