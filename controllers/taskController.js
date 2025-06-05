const express = require('express');
const mongoose = require('mongoose');
const Task = require('../models/taskModel');
const Driver = require('../models/driverModel');
const Bookform = require('../models/checkoutModel');

// Get all bookings for a specific driver
const getBookingsForDriver = async (req, res) => {
    const { driverId } = req.params;

    if (!driverId) {
        return res.status(400).json({ success: false, message: "Driver ID is required" });
    }

    try {
        // Find all tasks for the given driver and populate booking and driver details
        const tasks = await Task.find({ driver: driverId })
            .populate('booking')  // Populate booking details
            .populate('driver')   // Populate driver details
            .exec();

        // If no tasks are found
        if (tasks.length === 0) {
            return res.status(404).json({ success: false, message: 'No bookings found for this driver' });
        }

        // Return the tasks with populated details
        res.json({
            success: true,
            message: "Bookings retrieved successfully",
            tasks: tasks
        });
    } catch (error) {
        console.error('Error retrieving bookings for driver:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getBookingsForDriver,
    // other controllers...
};
