const express = require('express');
const mongoose = require('mongoose');
const Payment = require('../models/PaymentModel'); // Ensure this path is correct
const stripe = require('stripe')('sk_test_51PsifGP6k3IQ77YBE98XROIJtJc4wGDoTfrKcTpmLBR73FBj7yP2KXGSZeDDC8zXIp5rRHnkqQnp2aibECXsRHTR00hoZqKAe2');
const router = express.Router();
const Bookform = require('../models/checkoutModel');
const Reserve = require('../models/reserveModel');
const Vehicle = require('../models/vehicleModel');
const NewVehicle = require("../models/newVehicleModel");
const User=require("../models/userModel");
const booking=require("../models/checkoutModel");


// Handler function to create and save payment info
const PaymentInfo = async (req, res) => {
  try {
    // Create a new Payment instance with data from req.body
    const createPayment = new Payment(req.body);

    // Save the new Payment document to the database
    const savedPayment = await createPayment.save();

    // Send a success response with the saved document
    res.status(201).json(savedPayment);
  } catch (error) {
    // Send an error response if something goes wrong
    res.status(400).json({ message: error.message });
  }
};

// Handler function to fetch all payment records
const getAllPayments = async (req, res) => {
  try {
    const charges = await stripe.charges.list({
      limit: 100, // You can adjust the limit as per your needs
    });
    res.status(200).json(charges.data);
  } catch (error) {
    console.error('Error fetching payments from Stripe:', error);
    res.status(500).json({ error: 'Error fetching payments' });
  }
};

const getAllPays = async (req, res) => {
  try {

    const { email, page = 1, limit = 10 } = req.query;

    let query = {};
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    //   const enrichedPayments = await Promise.all(
    //   payments.map(async (payment) => {
    //     let userName = null;
    //     let invoiceId=null;

    //     if (payment.userId) {
    //       const user = await User.findById(payment.userId).select("fullName");
    //       userName = user?.fullName || null;
    //     }
    //      if (payment.bookingId) {
    //       const bookingData = await booking.findById(payment.bookingId).select("invoiceId");
    //       invoiceId = bookingData?.invoiceId || null;
    //     }

    //     return {
    //       ...payment.toObject(),
    //       userName,
    //       invoiceId
    //     };
    //   })
    // );
const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        let userName = null;
        let invoiceId = null;

        // Get user name
        if (payment.userId) {
          const user = await User.findById(payment.userId).select("fullName");
          userName = user?.fullName || null;
        }

        return {
          ...payment.toObject(),
          userName,
        };
      })
    );
    const totalDocuments = await Payment.countDocuments(query);

    res.status(200).json({
      data: enrichedPayments,
      totalDocuments,
      totalPages: Math.ceil(totalDocuments / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const deletePayment = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPayment = await Payment.findByIdAndDelete(id);
    if (!deletedPayment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment', error: error.message });
  }
};

const getPaymentIntent = async (transactionId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
    return paymentIntent;
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    throw error;
  }
};


const getPaymentById = async (req, res) => {
  try {

    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }


    const bookingDetails = await Bookform.findById(payment.bookingId);


    const reservationDetails = await Reserve.findById(payment.reservation);

    let vehicleDetails = null;
    if (reservationDetails && reservationDetails.vehicleId) {
      vehicleDetails = await NewVehicle.findById(reservationDetails.vehicleId).select(
        'vname passenger tagNumber image'
      );
    }

    res.status(200).json({
      message: 'Payment By Id',
      payment,
      bookingDetails: bookingDetails || null,
      reservationDetails: reservationDetails || null,
      vehicleDetails: vehicleDetails || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment', error: error.message });
  }
};



// Export the handler functions
module.exports = {
  PaymentInfo,
  getAllPayments,
  deletePayment,
  getPaymentIntent,
  getAllPays,
  getPaymentById
};
