// models/Auth.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const authSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  mobileNumber:{type:String,require:true},
  otp: { type: String },
  otpExpiration: { type: Date },
  role:{ enum:['User','Driver' , 'Admin'],
     type: String,
     required: true 
  },
 
});


module.exports = mongoose.model('Auth', authSchema);
