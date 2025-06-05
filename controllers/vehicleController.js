const Vehicle = require("../models/vehicleModel");
const mongoose = require('mongoose');

// Create 
exports.createVehicle = async (req, res) => {
  const { vname, passenger, vprice, tagNumber, isAvailable,model } = req.body; 
  const images = req.fileLocations;

  try {
    if (!vname || !passenger || !vprice || !tagNumber || !model) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existingVehicle = await Vehicle.findOne({ tagNumber });
    if (existingVehicle) {
      return res.status(400).json({ message: 'Tag number already exists' });
    }

    // Parse vprice from the request body (assuming it's an array of objects)
    const parsedVPrice = JSON.parse(vprice);

    const latestVehicle = await Vehicle.findOne().sort({ createdAt: -1 }).select('vehicleID');
    const newIdNumber = latestVehicle && latestVehicle.vehicleID
      ? parseInt(latestVehicle.vehicleID.split('-')[1]) + 1
      : 1000000000;
    const vehicleID = `VEH-${newIdNumber}`;

    const vehicleEntry = new Vehicle({
      vehicleID,
      vname,
      passenger,
      vprice: parsedVPrice, 
      image: images,
      tagNumber,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      model
    });

    const newVehicle = await vehicleEntry.save();

    res.status(201).json({
      id: newVehicle._id,
      vehicleID: newVehicle.vehicleID,
      vname: newVehicle.vname,
      passenger: newVehicle.passenger,
      vprice: newVehicle.vprice,
      image: newVehicle.image,
      tagNumber: newVehicle.tagNumber,
      isAvailable: newVehicle.isAvailable,
      model: newVehicle.model,
      createdAt: newVehicle.createdAt,
      updatedAt: newVehicle.updatedAt,
    });
  } catch (err) {
    console.error("Error creating vehicle:", err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.tagNumber) {
      return res.status(400).json({ message: 'Tag number must be unique' });
    }
    res.status(400).json({ message: err.message });
  }
};

// Update 
exports.updateVehicle = async (req, res) => {
  const { vname, passenger, vprice, tagNumber, isAvailable,model } = req.body; 
  const updateData = { vname, passenger, tagNumber,model }; 

  try {
    const existingVehicle = await Vehicle.findById(req.params.id);
    if (!existingVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (vprice) {
      updateData.vprice = JSON.parse(vprice);
    } else {
      updateData.vprice = existingVehicle.vprice; 
    }

    if (req.fileLocations && req.fileLocations.length > 0) {
      updateData.image = req.fileLocations;
    } else {
      updateData.image = existingVehicle.image;
    }

    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable; 
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json(updatedVehicle);
  } catch (err) {
    console.error("Error updating vehicle:", err);
    res.status(400).json({ message: err.message });
  }
};

// getAll
exports.getVehicles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;


    const searchQuery = search
      ? {
          $or: [
            { vname: { $regex: search, $options: "i" } }, 
            { tagNumber: { $regex: search, $options: "i" } } 
          ]
        }
      : {}; 

    const vehicles = await Vehicle.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));


    const totalCount = await Vehicle.countDocuments(searchQuery);

    const formattedVehicles = vehicles.map((vehicle) => ({
      ...vehicle.toObject(),
      image: vehicle.image,
    }));

    res.status(200).json({
      vehicles: formattedVehicles,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
      totalCount,
    });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ message: err.message });
  }
};


// Delete 
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    await Vehicle.deleteOne({ _id: req.params.id });
    res.json({ message: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get  by Season and Day
exports.getVehiclesBySeasonAndDay = async (req, res) => {
  const { season, day } = req.query;

  if (!season || !day) {
    return res.status(400).json({ message: "Season and day are required" });
  }

  try {
    // Include the condition for isAvailable = true
    const vehicles = await Vehicle.find({
      "vprice.season": season,
      "vprice.day": day,
      isAvailable: true, // Filter only available vehicles
    });

    if (vehicles.length === 0) {
      return res.status(404).json({ message: "No vehicles found for the selected season and day" });
    }

    const formattedVehicles = vehicles.map(vehicle => {
      const priceEntry = vehicle.vprice.find(
        price => price.season === season && price.day === day
      );

      return {
        _id: vehicle._id,
        vname: vehicle.vname,
        passenger: vehicle.passenger,
        season,
        day,
        price: priceEntry ? priceEntry.price : null,
        image: vehicle.image,
        tagNumber: vehicle.tagNumber,
        model: vehicle.model,
        isAvailable: vehicle.isAvailable, // Include isAvailable in the response
      };
    });

    res.status(200).json(formattedVehicles);
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


// Get price 
exports.getVehiclePrice = async (req, res) => {
  const { vehicleID } = req.params;
  const { season, day } = req.query;

  if (!season || !day) {
    return res.status(400).json({ message: "Season and day are required" });
  }

  try {
    const vehicle = await Vehicle.findOne({
      _id: vehicleID,
      "vprice.season": season,
      "vprice.day": day,
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Find the price for the specific season and day
    const priceEntry = vehicle.vprice.find(
      (price) => price.season === season && price.day === day
    );

    if (priceEntry) {
      return res.status(200).json({
        _id: vehicle._id,
        vehicleID: vehicle.vehicleID,
        vname: vehicle.vname,
        tagNumber: vehicle.tagNumber,
        model: vehicle.model,
        season: season,
        day: day,
        price: priceEntry.price,
        passenger: vehicle.passenger,
        image: vehicle.image,
      });
    } else {
      return res.status(404).json({ message: "Price not set for the selected season and day" });
    }
  } catch (err) {
    console.error("Error fetching vehicle price:", err);
    res.status(500).json({ message: err.message });
  }
};



exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await Vehicle.findById(id).select("vname passenger tagNumber model");

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    res.status(200).json(vehicle);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


exports.updateAvailability = async (req, res) => {
  try {
    const { id } = req.params; 
    const { isAvailable } = req.body; 

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({ message: 'Invalid value for isAvailable. It must be true or false.' });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      id,
      { isAvailable },
      { new: true } 
    );

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    res.status(200).json({ message: 'Vehicle availability updated successfully'});
  } catch (error) {
    console.error('Error updating vehicle availability:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};


