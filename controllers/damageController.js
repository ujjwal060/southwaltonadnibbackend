const mongoose = require("mongoose");
const { Types: { ObjectId } } = mongoose;
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require("../models/PaymentModel");
const Bookform = require('../models/checkoutModel');
const Vehicle = require('../models/vehicleModel');
const Damage = require("../models/damageModel");
const Reserve = require('../models/reserveModel');
const multer = require('multer');
const PDFDocument = require("pdfkit");
const path = require('path');
const fs = require('fs');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });


// Create Damage Record
exports.createDamage = async (req, res) => {
  try {
    const { paymentId } = req.body;
    const images = req.fileLocations; 
    const objectIdPaymentId = new ObjectId(paymentId);

    const payment = await Payment.findById(objectIdPaymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `No payment record found for the provided paymentId: ${paymentId}`,
      });
    }

    const { bookingId, transactionId } = payment;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: `Booking ID is undefined in payment record: ${paymentId}`,
      });
    }

    const bookingDetails = await Bookform.findById(bookingId);
    if (!bookingDetails) {
      return res.status(404).json({
        success: false,
        message: `No booking record found for the provided bookingId: ${bookingId}`,
      });
    }

    // Check if booking status is 'DELIVERED'
    if (bookingDetails.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Damage record can only be created if the booking status is 'COMPLETED'. Current status: ${bookingDetails.status}`,
      });
    }

    const { amount, reservation } = payment;
    if (!reservation) {
      return res.status(400).json({
        success: false,
        message: `Reservation is undefined in payment record: ${paymentId}`,
      });
    }

    const reservationDetails = await Reserve.findById(reservation);
    if (!reservationDetails) {
      return res.status(404).json({
        success: false,
        message: `No reservation record found for the provided Reservation ID: ${reservation}`,
      });
    }

    const vehicleId = reservationDetails.vehicleId;
    if (!vehicleId) {
      return res.status(404).json({
        success: false,
        message: `Vehicle ID not found in Reservation: ${reservation}`,
      });
    }

    const vehicleDetails = await Vehicle.findById(vehicleId);
    if (!vehicleDetails) {
      return res.status(404).json({
        success: false,
        message: `No vehicle record found for the provided vehicleId: ${vehicleId}`,
      });
    }

    // Determine damage status based on the presence of images
    const damage = images && images.length > 0 ? true : false;

    const newDamage = new Damage({
      paymentId,
      transactionId,
      bookingId,
      damage,
      images,
    });

    const savedDamage = await newDamage.save();

    res.status(200).json({
      success: true,
      message: 'Damage record created successfully',
      data: {
        damageId: savedDamage._id,
        bookingId: savedDamage.bookingId,
        paymentId: savedDamage.paymentId,
        amount,
        transactionId: savedDamage.transactionId,
        damage: savedDamage.damage,
        images: savedDamage.images,
        bookingDetails: {
          bname: bookingDetails.bname,
          bphone: bookingDetails.bphone,
          bemail: bookingDetails.bemail,
          baddress: bookingDetails.baddress,
          baddressh: bookingDetails.baddressh,
        },
        reservationDetails: {
          vehicleId: reservationDetails.vehicleId,
          pickup: reservationDetails.pickup,
          drop: reservationDetails.drop,
          pickdate: reservationDetails.pickdate,
          dropdate: reservationDetails.dropdate,
        },
        vehicleDetails: {
          vname: vehicleDetails.vname,
          vseats: vehicleDetails.passenger,
          tagNumber: vehicleDetails.tagNumber,
        },
      },
    });
  } catch (error) {
    console.error('Error creating damage record:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create damage record',
      error: error.message,
    });
  }
};




exports.sendDamageReport = async (req, res) => {
  try {
    if (req.method === 'GET') {
      // Handle GET request
      const { damageId } = req.query; // Assuming `damageId` is sent as a query parameter

      // Find the damage record in the database
      const damage = await Damage.findById(damageId).lean(); // Use lean to get a plain JS object
      if (!damage) {
        return res.status(404).json({ success: false, message: 'Damage record not found' });
      }

      return res.status(200).json({ success: true, data: damage });
    } else if (req.method === 'POST') {
      // Handle POST request
      const { damageId } = req.body;

      // Find the damage record in the database
      const damage = await Damage.findById(damageId).lean(); // Use lean to get a plain JS object
      if (!damage) {
        return res.status(404).json({ success: false, message: 'Damage record not found' });
      }

      // Fetch related booking details
      const bookingDetails = await Bookform.findById(damage.bookingId);
      if (!bookingDetails) {
        return res.status(404).json({ success: false, message: 'Booking details not found' });
      }

      // Fetch the reservation to get vehicle details
      const paymentDetails = await Payment.findById(damage.paymentId);
      if (!paymentDetails || !paymentDetails.reservation) {
        return res.status(404).json({
          success: false,
          message: 'Reservation details not found for the associated payment',
        });
      }

      const reservationDetails = await Reserve.findById(paymentDetails.reservation);
      if (!reservationDetails || !reservationDetails.vehicleId) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle details not found for the associated reservation',
        });
      }

      const vehicleDetails = await Vehicle.findById(reservationDetails.vehicleId);
      if (!vehicleDetails) {
        return res.status(404).json({ success: false, message: 'Vehicle record not found' });
      }

      // Create the PDF document
      const doc = new PDFDocument();

      // Temporary path to store the generated PDF
      const pdfPath = path.join(__dirname, 'damage-report.pdf');
      const writeStream = fs.createWriteStream(pdfPath);

      doc.pipe(writeStream);

      // Add content to the PDF (customize as per your needs)
      doc.fontSize(16).text('Damage Report', { align: 'center' });
      doc.moveDown();

      // Add Damage Record Details
      doc.fontSize(12).text(`Damage ID: ${damage._id}`);
      doc.text(`Description: ${damage.damage}`);
      doc.text(`Transaction ID: ${damage.transactionId}`);
      doc.moveDown();

      // Add Payment Details
      doc.fontSize(14).text('Payment Details', { underline: true });
      doc.fontSize(12).text(`Payment ID: ${damage.paymentId}`);
      doc.text(`Transaction ID: ${paymentDetails.transactionId}`);
      doc.text(`Amount Paid: ${paymentDetails.amount}`);
      doc.moveDown();

      // Add Booking Details
      doc.fontSize(14).text('Booking Details', { underline: true });
      doc.fontSize(12).text(`Customer Name: ${bookingDetails.bname}`);
      doc.text(`Phone: ${bookingDetails.bphone}`);
      doc.text(`Email: ${bookingDetails.bemail}`);
      doc.text(`Pickup Location: ${bookingDetails.bpickup}`);
      doc.text(`Drop Location: ${bookingDetails.bdrop}`);
      doc.text(`Pickup Date: ${bookingDetails.bpickDate}`);
      doc.text(`Drop Date: ${bookingDetails.bdropDate}`);
      doc.moveDown();

      // Add Vehicle Details
      doc.fontSize(14).text('Vehicle Details', { underline: true });
      doc.fontSize(12).text(`Vehicle Name: ${vehicleDetails.vname}`);
      doc.fontSize(12).text(`Tag Number: ${vehicleDetails.tagNumber}`);
      doc.text(`Seats: ${vehicleDetails.passenger}`);
      doc.text(`Vehicle ID: ${vehicleDetails._id}`);
      doc.moveDown();
      doc.end();

      writeStream.on('finish', () => {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=damage-report.pdf');
        const pdfFileStream = fs.createReadStream(pdfPath);
        pdfFileStream.pipe(res);

        // Optionally, delete the PDF after sending to save space
        pdfFileStream.on('end', () => {
          fs.unlinkSync(pdfPath);
        });
      });
    } else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};



exports.getDamages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Create search filter for tagNumber and vname
    const searchFilter = search
      ? {
          $or: [
            { 'vehicleDetails.tagNumber': { $regex: search, $options: 'i' } },
            { 'vehicleDetails.vname': { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // Fetch all damages with related details
    const allDamages = await Damage.find()
      .sort({ createdAt: -1 })
      .lean(); // Use lean for better performance

    // Enrich damages with related details
    const enrichedDamages = await Promise.all(
      allDamages.map(async (damage) => {
        const bookingDetails = await Bookform.findById(damage.bookingId);
        const paymentDetails = await Payment.findById(damage.paymentId);

        const reservationDetails = paymentDetails && paymentDetails.reservation
          ? await Reserve.findById(paymentDetails.reservation)
          : null;

        const vehicle = reservationDetails
          ? await Vehicle.findById(reservationDetails.vehicleId)
          : null;

        const vehicleDetails = vehicle
          ? {
              vname: vehicle.vname,
              passenger: vehicle.passenger,
              image: vehicle.image,
              tagNumber: vehicle.tagNumber,
            }
          : null;

        return {
          ...damage,
          bookingDetails: bookingDetails
            ? {
                bname: bookingDetails.bname,
                bphone: bookingDetails.bphone,
                bemail: bookingDetails.bemail,
                baddress: bookingDetails.baddress,
                baddressh: bookingDetails.baddressh,
              }
            : null,
          vehicleDetails,
          reservationDetails: reservationDetails
            ? {
                pickup: reservationDetails.pickup,
                drop: reservationDetails.drop,
                pickdate: reservationDetails.pickdate,
                dropdate: reservationDetails.dropdate,
                days: reservationDetails.days,
                vehicleId: reservationDetails.vehicleId,
                transactionId: reservationDetails.transactionId,
                booking: reservationDetails.booking,
                reservation: reservationDetails.reservation,
                userId: reservationDetails.userId,
                accepted: reservationDetails.accepted,
              }
            : null,
        };
      })
    );

    // Apply search filter
    const filteredDamages = enrichedDamages.filter((damage) =>
      search
        ? damage.vehicleDetails &&
          (damage.vehicleDetails.tagNumber?.toLowerCase().includes(search.toLowerCase()) ||
            damage.vehicleDetails.vname?.toLowerCase().includes(search.toLowerCase()))
        : true
    );

    // Paginate filtered damages
    const paginatedDamages = filteredDamages.slice(
      (pageNumber - 1) * limitNumber,
      pageNumber * limitNumber
    );

    res.json({
      success: true,
      message: 'Damages retrieved successfully',
      data: paginatedDamages,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(filteredDamages.length / limitNumber),
        totalItems: filteredDamages.length,
        itemsPerPage: limitNumber,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};




// GetbyID 
exports.getDamageById = async (req, res) => {
  try {
    // Fetch the damage record by ID
    const damage = await Damage.findById(req.params.id);

    if (!damage) {
      return res.status(404).json({
        success: false,
        message: "Damage record not found",
      });
    }


    const bookingDetails = await Bookform.findById(damage.bookingId);

    // Fetch payment details to retrieve reservation string
    const paymentDetails = await Payment.findById(damage.paymentId);

    const reservationDetails = paymentDetails && paymentDetails.reservation
      ? await Reserve.findOne({ _id: paymentDetails.reservation })
      : null;
    const vehicle = reservationDetails ? await Vehicle.findById(reservationDetails.vehicleId) : null;

    // Select specific keys ('vname', 'vseats', 'image')
    const vehicleDetails = vehicle ? {
      vname: vehicle.vname,
      tagNumber: vehicle.tagNumber,
      passenger: vehicle.passenger,
      image: vehicle.image
    } : null;

    res.json({
      success: true,
      message: 'Damage record retrieved successfully',
      data: {
        ...damage.toObject(),
        images: damage.images,
        bookingDetails: bookingDetails ? {
          bname: bookingDetails.bname,
          bphone: bookingDetails.bphone,
          bemail: bookingDetails.bemail,
          baddress: bookingDetails.baddress,
          baddressh: bookingDetails.baddressh,
        } : null,
        vehicleDetails: vehicleDetails ? {
          vname: vehicleDetails.vname,
          tagNumber: vehicleDetails.tagNumber,
          passenger: vehicleDetails.passenger,
          image: vehicleDetails.image,
        } : null,
        reservationDetails: reservationDetails ? {
          pickup: reservationDetails.pickup,
          drop: reservationDetails.drop,
          pickdate: reservationDetails.pickdate,
          dropdate: reservationDetails.dropdate,
          days: reservationDetails.days,
          vehicleid: reservationDetails.vehicleid,
          transactionid: reservationDetails.transactionid,
          booking: reservationDetails.booking,
          reservation: reservationDetails.reservation,
          userId: reservationDetails.userId,
          accepted: reservationDetails.accepted,
        } : null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Update 
exports.updateDamage = async (req, res) => {
  try {
    const updateData = {
      damage: req.body.damage,
      reason: req.body.reason,
    };

    if (req.files) {
      updateData.images = req.files.map(file => file.filename);
    }

    const updatedDamage = await Damage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedDamage) {
      return res.status(404).json({
        success: false,
        message: "Damage record not found",
      });
    }

    res.json({
      success: true,
      message: 'Damage record updated successfully',
      data: updatedDamage,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete
exports.deleteDamage = async (req, res) => {
  try {
    const damage = await Damage.findById(req.params.id);
    if (!damage) {
      return res.status(404).json({
        success: false,
        message: "Damage record not found",
      });
    }
    await Damage.deleteOne({ _id: req.params.id });
    res.json({
      success: true,
      message: "Damage record deleted",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// Process Refund
exports.processRefund = async (req, res) => {
  const { id: paymentId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid paymentId format',
      });
    }
    const payment = await Payment.findOne({ _id: paymentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: `No payment record found for the provided paymentId: ${paymentId}`,
      });
    }

    const { transactionId } = payment;
    const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
    if (!paymentIntent || !paymentIntent.latest_charge) {
      return res.status(404).json({
        success: false,
        message: 'No charge found for the paymentIntent',
      });
    }

    const chargeId = paymentIntent.latest_charge;

    const refund = await stripe.refunds.create({
      charge: chargeId,
      amount: Math.floor(0.25 * paymentIntent.amount_received),
    });


    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      refund: refund,
    });
  } catch (error) {
    console.error('Refund Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message,
    });
  }
};


exports.getDamagesByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { tagNumber } = req.query;  

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({ message: 'Invalid driver ID.' });
    }

    const bookings = await Bookform.find({ driver: driverId }, '_id');
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this driver.' });
    }

    const bookingIds = bookings.map((booking) => booking._id);

    const damages = await Damage.find({ bookingId: { $in: bookingIds } });

    if (!damages || damages.length === 0) {
      return res.status(404).json({ message: 'No damages found for this driver.' });
    }

    const damagesWithDetails = await Promise.all(
      damages.map(async (damage) => {
        const payment = await Payment.findOne({ _id: damage.paymentId }, 'reservation');
        let reservationDetails = null;
        let vehicleDetails = null;

        if (payment && payment.reservation) {
          reservationDetails = await Reserve.findOne({ _id: payment.reservation });

          if (reservationDetails && reservationDetails.vehicleId) {
            vehicleDetails = await Vehicle.findOne(
              { _id: reservationDetails.vehicleId },
              'image vname passenger tagNumber' 
            );
          }
        }
        return {
          ...damage._doc,
          reservationDetails: reservationDetails || null, 
          vehicleDetails: vehicleDetails || null, 
        };
      })
    );

    // Filter damages by tagNumber if provided (starting letters match)
    const filteredDamages = tagNumber
      ? damagesWithDetails.filter(damage => 
          damage.vehicleDetails && damage.vehicleDetails.tagNumber && damage.vehicleDetails.tagNumber.startsWith(tagNumber)
        )
      : damagesWithDetails;

    return res.status(200).json({ damages: filteredDamages });
  } catch (error) {
    console.error('Error fetching damages:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};




