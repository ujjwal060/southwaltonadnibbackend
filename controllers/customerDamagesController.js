const CustomerDamage = require('../models/customerDamagesModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')
const Payment = require('../models/PaymentModel');
const Reserve = require('../models/reserveModel');
const Vehicle = require("../models/vehicleModel");
const NewVehicle = require("../models/newVehicleModel");


exports.getAllCustomerDamage = async (req, res, next) => {
  try {
    const { page = 1, limit = 5, search = "" } = req.query;

    const skip = (page - 1) * limit;

    const customerDamage = await CustomerDamage.find().lean();

    const filteredDamage = await Promise.all(
      customerDamage.map(async (damage) => {
        const paymentDetails = await Payment.findById(damage.paymentId).lean();

        let reservationDetails = null;
        if (paymentDetails?.reservation) {
          reservationDetails = await Reserve.findById(paymentDetails.reservation).lean();

          if (reservationDetails?.vehicleId) {
            const vehicleDetails = await NewVehicle.findById(reservationDetails.vehicleId)
              .select('vname tagNumber passenger image') 
              .lean();
            reservationDetails.vehicleDetails = vehicleDetails;
            const matchesSearch =
              search.trim() === "" ||
              vehicleDetails?.vname?.toLowerCase().includes(search.toLowerCase()) ||
              vehicleDetails?.tagNumber?.toLowerCase().includes(search.toLowerCase());

            if (!matchesSearch) return null; 
          }
        }

        return { 
          ...damage, 
          paymentDetails: { 
            ...paymentDetails, 
            reservationDetails 
          } 
        };
      })
    );
    const nonNullDamage = filteredDamage.filter(Boolean);
    const totalItems = nonNullDamage.length;
    const totalPages = Math.ceil(totalItems / limit);

    const paginatedDamage = nonNullDamage.slice(skip, skip + limit);

    res.json({
      success: true,
      message: 'Customer Damages with Search and Pagination',
      data: paginatedDamage,
      pagination: {
        currentPage: parseInt(page),
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: parseInt(limit),
      }
    });
  } catch (error) {
    console.error(error);
    return next(createError(500, "Internal Server Error!"));
  }
};


exports.deleteDamage = async (req, res, next) => {
  try {
      const { id } = req.params;
      const damage = await CustomerDamage.findByIdAndDelete(id);
      if (!damage) {
          return next(createError(404, "Damage not found"));
      }
      return next(createSuccess(200, "Damage deleted", damage));
  } catch (error) {
      return next(createError(500, "Internal Server Error1"))
  }
}

exports.getDamageById = async (req, res, next) => {
  try {
      const damage = await CustomerDamage.findById(req.params.id);
      if (!damage) {
          return next(createError(404, "Damage Not Found"));
      }
      return next(createSuccess(200, "Single Damage", damage));
  } catch (error) {
      return next(createError(500, "Internal Server Error1"))
  }
}