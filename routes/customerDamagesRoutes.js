const express = require('express');
const router = express.Router();
const customerDamagesController = require('../controllers/customerDamagesController');
const upload = require('../middleware/multer'); // Your multer.js file



router.get('/', customerDamagesController.getAllCustomerDamage); 
router.get('/:id', customerDamagesController.getDamageById);
router.delete('/:id', customerDamagesController.deleteDamage);

module.exports = router;
