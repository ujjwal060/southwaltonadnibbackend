const express = require('express');
const mongoose = require('mongoose');
const Reserve = require('../models/reserveModel');
const Bookform = require('../models/checkoutModel');
const router = express.Router();
const Payment = require('../models/PaymentModel');
const nodemailer = require('nodemailer');
const User = require('../models/userModel');
const Vehicle = require("../models/vehicleModel");
const NewVehicle = require("../models/newVehicleModel");
const bookingModdel=require("../models/checkoutModel");

// Create a new reservation
const createReservation = async (req, res) => {
  try {
    const reservationData = {
      ...req.body,
      fromAdmin: true,
    };

    const reserveform = new Reserve(reservationData);
    const savedForm = await reserveform.save();

    res.status(201).json({ id: savedForm._id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const getAllReservations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchQuery = req.query.search || '';

    const skip = (page - 1) * limit;

    const vehicleFilter = searchQuery
      ? {
        $or: [
          { vname: { $regex: searchQuery, $options: 'i' } },
          { tagNumber: { $regex: searchQuery, $options: 'i' } },
        ],
      }
      : {};

    const vehicles = await NewVehicle.find(vehicleFilter).select('_id');
    const vehicleIds = vehicles.map((vehicle) => vehicle._id);

    const reservationFilter = searchQuery
      ? { vehicleId: { $in: vehicleIds } }
      : {};

    const reservations = await Reserve.find(reservationFilter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

   
    const enrichedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        let vehicleDetails = null;
        if (reservation.vehicleId) {
          vehicleDetails = await NewVehicle.findOne({ _id: reservation.vehicleId })
            .select('vname tagNumber passenger image model');
        }
        const payment = await Payment.findOne({ reservation: reservation._id }).select('userId');
        const bookingdata = await bookingModdel.findOne({ reservationId: reservation._id }).select('invoiceNumber');
        let userName = null;
        if (payment?.userId) {
          const user = await User.findById(payment.userId).select('fullName');
          userName = user?.fullName || null;
        }

        return {
          ...reservation.toObject(),
          vehicleDetails,
          userName,
          invoiceNumber:bookingdata.invoiceNumber || 'N/A'
        };
      })
    );

    const totalReservations = await Reserve.countDocuments(reservationFilter);

    const totalPages = Math.ceil(totalReservations / limit);

    res.json({
      success: true,
      message: 'All Reservations',
      data: enrichedReservations,
      pagination: {
        totalReservations,
        totalPages,
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllReservationsFromPanel = async (req, res) => {
  try {
    const reservations = await Reserve.find({
      $and: [
        { reservation: true },
        { booking: false },
        { fromAdmin: true },
      ]
    });

    const populatedReservations = await Promise.all(
      reservations.map(async (reservation) => {
        if (reservation.vehicleId) {
          const vehicle = await NewVehicle.findOne(
            { _id: reservation.vehicleId },
            'vname passenger image tagNumber model'
          );
          return {
            ...reservation.toObject(),
            vehicleDetails: vehicle || null,
          };
        }
        return {
          ...reservation.toObject(),
          vehicleDetails: null,
        };
      })
    );

    res.status(200).json(populatedReservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//accept
const acceptReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await Reserve.findById(id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    reservation.booking = true;
    await reservation.save();
    const payment = await Payment.findOne({ reservation: id });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found for this reservation." });
    }

    const user = await User.findById(payment.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Reservation Accepted',
      text: `Your reservation with ID ${id} has been accepted. Kindly continue with your booking. Thank you!`
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reservation accepted and email sent." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single reservation by ID
const getReservationById = async (req, res) => {
  try {
    const reservation = await Reserve.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.status(200).json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a reservation
const updateReservation = async (req, res) => {
  try {
    const updatedReservation = await Reserve.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedReservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.status(200).json(updatedReservation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const getReservationListingByDriverID = async (req, res) => {
  try {
    const driverId = req.params.driverId;

    // Find all reservations associated with the provided driver ID
    const reservations = await Bookform.find({ driver: driverId })
      .populate({
        path: 'reservationId',
        populate: {
          path: 'userId', // Populate user details in reservationId
          model: 'User',
          select: 'fullName email phoneNumber image', // Include image field
        }
      })
      .populate('driver')
      .populate('paymentId')
      .exec();

    if (reservations.length === 0) {
      return res.status(404).json({ message: 'No reservations found for this driver' });
    }

    return res.status(200).json({
      success: true,
      message: "Reservations Listing",
      data: reservations
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteReservation = async (req, res) => {
  try {
    const reserve = await Reserve.findById(req.params.id);
    if (!reserve) {
      return res.status(404).json({ message: "Reserve not found" });
    }
    await Reserve.deleteOne({ _id: req.params.id });
    res.json({ message: "Reserve deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createReservation,
  getAllReservations,
  acceptReservation,
  getReservationById,
  updateReservation,
  deleteReservation,
  getReservationListingByDriverID,
  getAllReservationsFromPanel
};

