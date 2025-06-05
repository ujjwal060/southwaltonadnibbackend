require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Replace with your Stripe secret key

module.exports = stripe;
