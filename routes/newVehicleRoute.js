const express = require('express');
const router = express.Router();
const newVehicleController = require('../controllers/newVehicleController');
const { uploadFilesToS3 } = require('../middleware/csvmiddleware');

router.get('/', newVehicleController.getVehicles);
router.post('/add', uploadFilesToS3, newVehicleController.createVehicle); 
router.put('/:id', uploadFilesToS3, newVehicleController.updateVehicle); 
router.delete('/:id', newVehicleController.deleteVehicle);
router.get('/vehicleData/:id', newVehicleController.getVehicleById);

router.get('/vehicleData', newVehicleController.getvehiclePricing); //all vehicle with price

router.get("/getVehicleWithPriceById/:vehicleId", newVehicleController.getVehicleWithPriceById);//single vehicle with price



module.exports = router;
