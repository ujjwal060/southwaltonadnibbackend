const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const {uploadToS3} = require("../controllers/commonController")

router.get('/', vehicleController.getVehicles);
router.post('/add', uploadToS3, vehicleController.createVehicle); 
router.put('/:id', uploadToS3, vehicleController.updateVehicle); 
router.delete('/:id', vehicleController.deleteVehicle);
router.get('/by-season-and-day', vehicleController.getVehiclesBySeasonAndDay); 
router.get('/price/:vehicleID', vehicleController.getVehiclePrice);
router.get('/:id', vehicleController.getVehicleById);
router.put('/:id/availability', vehicleController.updateAvailability);



module.exports = router;
