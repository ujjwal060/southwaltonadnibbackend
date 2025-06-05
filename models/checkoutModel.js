const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomerDriverSchema = new Schema({
    dphone: { type: String, required: true },
    demail: { type: String, required: true },
    dexperience: { type: String, required: true },
    dname: { type: String, required: true },
    dpolicy: { type: String, required: true },
    dlicense: { type: String, required: true },
})
const BookformSchema = new Schema({
    bname: { type: String, required: true },
    bphone: { type: Number, required: true },
    bemail: { type: String, required: true },
    bsize: { type: String, required: true },
    baddress: { type: String, required: false },
    baddressh: { type: String, required: false },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment', required: false },
    reservationId: { type: Schema.Types.ObjectId, ref: 'Reservation', required: false },
    vehicleId: { type: String, required: false },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
    status: { type: String, enum: ['PENDING', 'DELIVERED', 'COMPLETED'], default: 'PENDING' },
    fromAdmin: { type: Boolean, default: false },
    // Adding customerDrivers
    customerDrivers: [CustomerDriverSchema]
}, { timestamps: true });



module.exports = mongoose.model('Bookform', BookformSchema);
