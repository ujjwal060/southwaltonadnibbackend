const express = require('express');

const { createReservation, getAllReservations, acceptReservation, getReservationById, updateReservation,deleteReservation,getReservationListingByDriverID,getAllReservationsFromPanel  } = require('../controllers/reserveController');


const router = express.Router();

router.post('/reservation', createReservation);       
router.get('/reservations', getAllReservations);           
router.get('/reservation/:id', getReservationById);     
router.put('/reservation/:id', updateReservation);     
router.put('/reservation/:id/accept', acceptReservation);
router.delete('/reservation/:id', deleteReservation);
router.get('/reservations/driver/:driverId', getReservationListingByDriverID);
router.get('/reservations/fromPanel', getAllReservationsFromPanel);


module.exports = router;
