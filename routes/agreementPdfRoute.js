const express = require('express');
const router = express.Router();
const { handleRentalAgreement,processPayment } = require('../controllers/agreementPdfController');

// POST route to handle the rental agreement
router.post('/send-rental-agreement', handleRentalAgreement);
router.get('/process-payment', processPayment);

module.exports = router;
