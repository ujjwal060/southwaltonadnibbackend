
const express = require('express');
const router = express.Router();
const signController = require('../controllers/signController');


router.delete('/:id', signController.deleteSignature);

router.get('/get-sign', signController.getAllImages);

module.exports = router;
