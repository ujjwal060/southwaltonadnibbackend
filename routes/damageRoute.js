// routes/damageRoute.js
const express = require('express');
const router = express.Router();
const damageController = require('../controllers/damageController');
const { uploadToS3 } = require("../controllers/commonController"); 

// Define routes
router.get('/', damageController.getDamages);
router.get('/:id', damageController.getDamageById); 
router.post('/add', uploadToS3, damageController.createDamage); 
router.put('/:id', uploadToS3, damageController.updateDamage); 
router.delete('/:id', damageController.deleteDamage);
router.post('/refund/:id', damageController.processRefund);
router.post('/send-damage-report', damageController.sendDamageReport);
router.get('/getpdf/send-damage-report', damageController.sendDamageReport);
router.get('/damageList/:driverId', damageController.getDamagesByDriver);
module.exports = router;
