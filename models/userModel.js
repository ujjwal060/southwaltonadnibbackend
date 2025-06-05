const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for a single image
const imageSchema = new Schema({
    filename: { type: String, required: true },
    contentType: { type: String, required: true }
});

const UserSchema = new Schema(
    {
        fullName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        phoneNumber: { type: String },
        state: { type: String },
        image: imageSchema,
        otp: { type: String },
        otpExpiration: { type: Date },
        isActive: { type: String, enum: ['Active', 'Deactive'], default: 'Active' },
        roles: [{
            type: Schema.Types.ObjectId,
            ref: "Role",
            required: true
        }]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', UserSchema);
