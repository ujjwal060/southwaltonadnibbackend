const express = require('express');
const router = express.Router();

const { PaymentInfo, getAllPayments, getAllPays, getPaymentIntent, deletePayment, getPaymentById } = require('../controllers/PaymentController');

router.post('/register', PaymentInfo);

router.get('/stripe/payments', getAllPayments);
router.get('/pays', getAllPays);

router.get('/:transactionId', getPaymentIntent);
router.get('/payment/:id', getPaymentById)
router.delete('/:id', deletePayment);

module.exports = router;