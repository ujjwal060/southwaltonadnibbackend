const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
    offSeason: [
        {
            month: { type: String, required: true },
            dateFrom: { type: Date, required: true }, 
            dateTo: { type: Date, required: true } 
        }
    ],
    secondarySeason: [
        {
            month: { type: String, required: true }, 
            dateFrom: { type: Date, required: true }, 
            dateTo: { type: Date, required: true } 
        }
    ],
    peakSeason: [
        {
            month: { type: String, required: true }, 
            dateFrom: { type: Date, required: true }, 
            dateTo: { type: Date, required: true }
        }
    ]
});

module.exports = mongoose.model('Season', seasonSchema);
