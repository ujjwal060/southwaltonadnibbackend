const express = require('express');
const {createBookform , getAllBookforms,getBookformById, updateBookform, deleteBookform,getAllBookingsFromPanel,getAllBookingForCalendar} = require('../controllers/checkoutController')
const {uploadToS3} = require("../controllers/commonController")
const router = express.Router();

router.post('/create',uploadToS3,createBookform);
router.get('/', getAllBookforms);
router.get('/calendar', getAllBookingForCalendar);
router.get('/bookfromPanel', getAllBookingsFromPanel);
router.get('/:id', getBookformById);
router.put('/:id', updateBookform);
router.delete('/:id', deleteBookform);


module.exports = router;
