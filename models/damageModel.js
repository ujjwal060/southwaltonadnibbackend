const mongoose = require('mongoose');

const damageSchema = new mongoose.Schema({

  paymentId: { type: String, required: false, },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bookform', 
    required: true,
  },
  transactionId: { type: String, required: true, },
  damage: { type: Boolean, default: false },
  images: { type: [String] },
  approvedByAdmin: {
    type: String,
    default: false,
    required: false
  }
},
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Damage', damageSchema);
