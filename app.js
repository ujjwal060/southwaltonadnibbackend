// Load environment variables from .env file
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

// Import route handlers
const roleRoute = require('./routes/roleRoute');
const authRoute = require('./routes/authRoute');
const userRoute = require('./routes/userRoute');
const driverRoute = require('./routes/driverRoute');
const checkoutRoute = require('./routes/checkoutRoute');
const vehicleRoute = require('./routes/vehicleRoute');
const newVehicleRoute = require('./routes/newVehicleRoute');
const taskRoute = require('./routes/taskRoute');
const damageRoute = require('./routes/damageRoute');
const reserveRoute = require('./routes/reserveRoute');
const requestRoute = require('./routes/requestRoute')
const customerDamagesRoutes = require('./routes/customerDamagesRoutes');

const PaymentRoute = require('./routes/PaymentRoute');
const seasonRoute = require('./routes/seasonRoute');

const signRoutes = require('./routes/signRoute');
const feedbackRoute = require('./routes/feedbackRoute');
const rentalAgreementRoute = require('./routes/agreementPdfRoute');

// Retrieve environment variables
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URL;
const FRONTEND = process.env.FRONTEND;

// Initialize Express app
const app = express();

// Configure CORS options
var corsOptions = {
    origin: '*',
    optionsSuccessStatus: 200, // For legacy browsers support
    credentials: true // Allow credentials in CORS requests
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/role', roleRoute); // To create roles
app.use('/api/auth', authRoute); // To register and login
app.use('/api/user', userRoute); // To list users
app.use('/api/driver', driverRoute); // To list drivers
app.use('/api/book', checkoutRoute); // To list bookings
app.use('/api/vehicle', vehicleRoute);
app.use('/api/newVehicle', newVehicleRoute);
app.use('/api/task', taskRoute);
app.use('/api/damage', damageRoute);
app.use('/api/reserve', reserveRoute);
app.use('/api/pay', PaymentRoute);
app.use('/api/seasons', seasonRoute);
app.use('/api/sign', signRoutes);
app.use('/api/feedback', feedbackRoute);
app.use('/api/customer-damages', customerDamagesRoutes);
// Static file serving for image uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/request',requestRoute);
app.use('/api', rentalAgreementRoute);
// Global error handler middleware
app.use((obj, req, res, next) => {
    const statusCode = obj.status || 500;
    const message = obj.message || "Something went wrong!";
    return res.status(statusCode).json({
        success: [200, 201, 204].some(a => a === obj.status) ? true : false, // Determine success based on status code
        status: statusCode,
        message: message,
        data: obj.data
    });
});

// Connect to MongoDB and start the server
mongoose.set("strictQuery", false); // Set mongoose configuration option
mongoose.connect(MONGO_URL)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(PORT, () => {
            console.log(`Node API app is running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.log(error); // Log connection errors
    });
