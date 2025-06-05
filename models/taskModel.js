const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const taskSchema = new Schema({
    booking: {
        type: Schema.Types.ObjectId,
        ref: 'Bookform',
        required: true
    },
    driver: {
        type: Schema.Types.ObjectId,
        ref: 'Driver',
        required: true
    },
    taskStatus: {
        type: String,
        required: true,
    },
    // Additional task-specific fields
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
