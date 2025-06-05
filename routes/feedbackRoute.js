const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');

router.get('/', feedbackController.getFeedback);
router.post('/add', feedbackController.createFeedback); 
router.delete('/:id', feedbackController.deleteFeedback); 

module.exports = router;
