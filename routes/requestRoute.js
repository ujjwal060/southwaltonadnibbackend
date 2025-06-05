const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');


router.get('/', requestController.getAllRequests);
router.delete('/:id', requestController.deleteRequest)
module.exports = router;
