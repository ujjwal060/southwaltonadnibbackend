const express = require('express');
const mongoose = require('mongoose');
const Bookform = require('../models/checkoutModel');
const Driver = require('../models/driverModel');
const Payment = require('../models/PaymentModel');
const Reserve = require('../models/reserveModel');
const Vehicle = require("../models/vehicleModel");
const NewVehicle = require("../models/newVehicleModel");

const createBookform = async (req, res) => {
  try {
    // Destructure booking details
    const {
      bname,
      bphone,
      bemail,
      bsize,
      baddress,
      baddressh,
      paymentId,
      reservationId,
      driver,
      customerDrivers,
    } = req.body;

    // Handle uploaded files
    const fileLocations = req.fileLocations || [];
    if (fileLocations.length !== customerDrivers.length * 2) {
      return res.status(400).json({
        message: 'Each customer driver must have both dpolicy and dlicense files uploaded.',
      });
    }

    // Add file URLs to customerDrivers
    const enrichedCustomerDrivers = customerDrivers.map((driver, index) => ({
      ...driver,
      dpolicy: fileLocations[index * 2],
      dlicense: fileLocations[index * 2 + 1],
    }));

    // Fetch the reservation to get the associated vehicleId
    const reservation = await Reserve.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found.' });
    }

    const vehicleId = reservation.vehicleId;

    // Update the vehicle's isAvailable field to false
    const updatedVehicle = await NewVehicle.findByIdAndUpdate(
      vehicleId,
      { isAvailable: false },
      { new: true }
    );
    if (!updatedVehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    // Create booking
    const booking = new Bookform({
      bname,
      bphone,
      bemail,
      bsize,
      baddress,
      baddressh,
      paymentId,
      reservationId,
      driver,
      fromAdmin: true,
      customerDrivers: enrichedCustomerDrivers,
    });

    await booking.save();
    res.status(201).json({
      message: 'Booking created successfully.',
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking.', error: error.message });
  }
};

// Get all of website bookings
const getAllBookforms = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ fromAdmin: false,paymentType:"Booking" }).sort({ createdAt: -1 });

    if (!payments || payments.length === 0) {
      return res.status(404).json({ message: 'No payments found' });
    }

    const allBookforms = await Promise.all(
      payments.map(async (payment) => {
        try {
          console.log(payment.reservationId)
          const reservation = await Reserve.findById(payment.reservationId);
          if (!reservation) {
            console.log(`Reservation not found for Payment ID: ${payment._id}`);
            return null;
          }

          // Fetch Booking Details
          const booking = await Bookform.findOne({
            _id: payment.bookingId,
          })
            .populate('driver')
            .populate('customerDrivers');

          if (!booking) {
            console.log(
              `Booking not found for Payment ID: ${payment._id}`
            );
            return null;
          }

          return {
            paymentId: payment._id,
            userId: payment.userId,
            transactionId: payment.transactionId,
            email: payment.email,
            amount: payment.amount,
            reservationDetails: {
              pickup: reservation.pickup,
              drop: reservation.drop,
              pickdate: reservation.pickdate,
              dropdate: reservation.dropdate,
            },
            bookingDetails: {
              bookingId: booking._id,
              bname: booking.bname,
              bphone: booking.bphone,
              bemail: booking.bemail,
              baddress: booking.baddress,
              baddressh: booking.baddressh,
              driver: booking.driver,
              customerDrivers: booking.customerDrivers,
            },
          };
        } catch (err) {
          console.log(`Error fetching data for Payment ID: ${payment._id} - ${err.message}`);
          return null;
        }
      })
    );

    // Filter out null values
    const successfulBookforms = allBookforms.filter((form) => form !== null);

    // Filter by 'bemail' if a search query is provided
    const filteredBookforms = search
      ? successfulBookforms.filter((form) =>
          form.bookingDetails.bemail.toLowerCase().includes(search.toLowerCase())
        )
      : successfulBookforms;

    // Pagination logic
    const total = filteredBookforms.length;
    const paginatedBookforms = filteredBookforms.slice(
      (page - 1) * limit,
      page * limit
    );

    // Response
    return res.status(200).json({
      total,
      currentPage: Number(page),
      totalPages: Math.ceil(total / limit),
      data: paginatedBookforms,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


const getAllBookingForCalendar = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });

    if (!payments || payments.length === 0) {
      return res.status(404).json({ message: 'No payments found' });
    }

    const allBookforms = await Promise.all(
      payments.map(async (payment) => {
        try {
          // Fetch Reservation Details
          const reservation = await Reserve.findById(payment.reservation);
          if (!reservation) {
            console.log(`Reservation not found for Payment ID: ${payment._id}`);
            return null;
          }

          // Fetch Vehicle Details
          let vehicle = null;
          if (reservation.vehicleId) {
            vehicle = await NewVehicle.findById(reservation.vehicleId);
          }

          // Fetch Booking Details with 'fromAdmin: false'
          const booking = await Bookform.findOne({
            _id: payment.bookingId
          })
            .populate('driver')
            .populate('customerDrivers');

          if (!booking) {
            console.log(
              `Booking not found or does not meet 'fromAdmin: false' for Payment ID: ${payment._id}`
            );
            return null;
          }

          return {
            paymentId: payment._id,
            email: payment.email,
            amount: payment.amount,
            reservationDetails: {
              pickup: reservation.pickup,
              drop: reservation.drop,
              pickdate: reservation.pickdate,
              dropdate: reservation.dropdate,
              vehicle: vehicle ? { id: vehicle._id, vname: vehicle.vname,passenger: vehicle.passenger,tagNumber: vehicle.tagNumber, model:vehicle.model } : null,
            },
            bookingDetails: {
              bookingId: booking._id,
              bname: booking.bname,
              bphone: booking.bphone,
              bemail: booking.bemail,
              baddress: booking.baddress,
              baddressh: booking.baddressh,
              driver: booking.driver,
              customerDrivers: booking.customerDrivers,
            },
          };
        } catch (err) {
          console.log(`Error fetching data for Payment ID: ${payment._id} - ${err.message}`);
          return null;
        }
      })
    );

    // Filter out null values
    const successfulBookforms = allBookforms.filter((form) => form !== null);

    // Response
    return res.status(200).json({
      data: successfulBookforms,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


// get all bookings from panel

const getAllBookingsFromPanel = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    const searchFilter = {
      fromAdmin: true,
      $or: [
        { bname: { $regex: search, $options: 'i' } },
        { bemail: { $regex: search, $options: 'i' } }
      ]
    };

    const bookings = await Bookform.find(searchFilter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 })
      .populate('reservationId'); 

    const totalBookings = await Bookform.countDocuments(searchFilter);

    res.status(200).json({
      bookings, 
      totalBookings,
      totalPages: Math.ceil(totalBookings / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
};



// Get a specific booking form by ID
const getBookformById = async (req, res) => {
  try {
    // Fetch the Bookform
    const bookform = await Bookform.findById(req.params.id)
      .populate('driver')
      .populate('customerDrivers')
      .populate({
        path: 'paymentId',
        populate: {
          path: 'reservation', // Populate reservation details
          model: 'Reservation', // Referencing the Reservation model
        },
      });
    if (!bookform) {
      return res.status(404).json({ message: 'Booking form not found' });
    }

    const reservationDetails =
    bookform.paymentId && bookform.paymentId.reservation
      ? bookform.paymentId.reservation
      : null;

  return res.status(200).json({
    success: true,
    message: 'Booking found',
    booking: {
      ...bookform.toObject(),
      reservationDetails, // Attach only reservation details
    },
  });
} catch (error) {
    console.error('Error fetching booking:', error.message);
    res.status(500).json({ message: error.message });
  }
};





// Update a booking form by ID
const updateBookform = async (req, res) => {
  try {
    const updatedForm = await Bookform.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedForm) return res.status(404).json({ message: 'Booking form not found' });
    res.json(updatedForm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a booking form by ID
const deleteBookform = async (req, res) => {
  try {
    const deletedForm = await Bookform.findByIdAndDelete(req.params.id);
    if (!deletedForm) return res.status(404).json({ message: 'Booking form not found' });
    res.json({ message: 'Booking form deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBookform,
  getAllBookforms,
  getBookformById,
  updateBookform,
  deleteBookform,
  getAllBookingsFromPanel,
  getAllBookingForCalendar
};


