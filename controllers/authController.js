require('dotenv').config();
const Auth = require('../models/authModel');
const Role = require('../models/roleModel');
const createError = require('../middleware/error');
const createSuccess = require('../middleware/success');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');


const signup = async (req, res, next) => {
  try {
    const { name, mobileNumber, email, password } = req.body;
    const role = 'Admin';  // Enforcing role to be 'Admin'

    // Validate required fields
    if (!name) {
      return next(createError(400, "Name is required"));
    }
    if (!email) {
      return next(createError(400, "Email is required"));
    }
    if (!password) {
      return next(createError(400, "Password is required"));
    }

    // Check if the role exists
    const roleRecord = await Role.findOne({ role });
    if (!roleRecord) {
      return next(createError(400, "Role not found"));
    }

    // Create a new user with the specified role
    const newUser = new Auth({
      name,
      email,
      password,
      mobileNumber,
      role: roleRecord.role
    });

    // Save the new user to the database
    await newUser.save();
    return res.status(200).json("Signup Successfully");
  } catch (error) {
    console.error(error);
    return next(createError(500, "Something went wrong"));
  }
};

// Login
// const login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;

//     const user = await Auth.findOne({ email }).populate("role");

//     if (!user) {
//       return next(createError(404, "User Not Found"));
//     }

//     const isPasswordValid = user.password === password; // Note: Password should be hashed in a real-world scenario
//     if (!isPasswordValid) {
//       return next(createError(404, "Password is Incorrect"));
//     }

//     const token = jwt.sign(
//       { id: user._id, isAdmin: user.isAdmin, role: user.role },
//       process.env.JWT_SECRET
//     );

//     res.cookie("access_token", token, { httpOnly: true })
//       .status(200)
//       .json({
//         token,
//         status: 200,
//         message: "Login Success",
//         data: user
//       });
//   } catch (error) {
//     return next(createError(500, "Something went wrong"));
//   }
// };

const login = async (req, res) => {
  try {
    // Extract email and password from request body
    const { email, password } = req.body;

    // Hardcoded credentials
    const adminEmail = 'test@gmail.com';
    const adminPassword = '1234';

    // Check if the provided email and password match the hardcoded ones
    if (email !== adminEmail || password !== adminPassword) {
      return res.status(400).json({ 
        status: 400,
        message: 'Invalid email or password' 
      });
    }

    // Create a JWT token (adjust payload and secret as per your application)
    const token = jwt.sign(
      { userId: 'admin', role: 'admin' }, // Payload
      process.env.JWT_SECRET, // Secret key
      { expiresIn: '1h' } // Token expiry
    );

    // Set token as an HTTP-only cookie
    res.cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json({
        status: 200,
        message: "Login Success",
        token,
        data: { email: adminEmail, role: 'admin' }
      });
  } catch (error) {
    // Handle any unexpected errors
    res.status(500).json({ 
      status: 500,
      message: "Server error", 
      error: error.message 
    });
  }
};

// Register Admin
const registerAdmin = async (req, res, next) => {
  try {
    const role = await Role.findOne({ role: 'Admin' });
    const newUser = new Auth({
      mobileNumber: req.body.mobileNumber,
      email: req.body.email,
      password: req.body.password,
      isAdmin: true,
      role: role.role
    });
    await newUser.save();
    return next(createSuccess(200, "Admin Registered Successfully"));
  } catch (error) {
    return next(createError(500, "Something went wrong"));
  }
};

// Send Email
const sendEmail = async (req, res, next) => {
  const email = req.body.email;
  try {
    const user = await Auth.findOne({ email });

    if (!user) {
      return next(createError(404, "User Not found"));
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = otp;
    user.otpExpiration = Date.now() + 15 * 60 * 1000;
    await user.save();
    const ResetPasswordLink = `http://18.209.91.97:2023/reset-password?token=${otp}`;

    const mailTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailDetails = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      html: `<p>Your OTP for password reset is: <strong>${otp}</strong></p><p>This OTP is valid for 15 minutes.</p>
      <p><a href="${ResetPasswordLink}" style="padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a></p>`
    };

    await mailTransporter.sendMail(mailDetails);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Verify OTP
const verifyOTP = async (req, res, next) => {
  const { otp } = req.body;
  try {
    const user = await Auth.findOne({ otp, otpExpiration: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.status(200).json({ message: "OTP verified successfully", token });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Reset Password
const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userEmail = decodedToken.email;

    const user = await Auth.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's password directly (without hashing)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { signup, login, registerAdmin, sendEmail, verifyOTP, resetPassword };
