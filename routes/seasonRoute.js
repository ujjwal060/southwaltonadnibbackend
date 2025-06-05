const express = require('express');
const router = express.Router();
const seasonController = require('../controllers/seasonController');


router.post('/add', seasonController.createSeason);

router.post('/:seasonId?/add-entry', seasonController.addSeasonEntry);

router.get('/', seasonController.getAllSeasons);

router.get('/:id', seasonController.getSeasonById);

router.put('/:seasonId/:entryId', seasonController.updateSeasonEntry);

router.delete('/:seasonId/:seasonType/:entryId', seasonController.deleteSeasonEntry);

router.post('/season-details', seasonController.getSeasonDetails);

module.exports = router;

//          

