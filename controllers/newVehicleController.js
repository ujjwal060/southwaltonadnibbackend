const NewVehicle = require("../models/newVehicleModel");

const mongoose = require('mongoose');
const axios = require('axios');
const csvParser = require('csv-parser');

// Create 
exports.createVehicle = async (req, res) => {
  const { vname, passenger, tagNumber, isAvailable, model } = req.body;

  try {
    if (!vname || !passenger || !tagNumber || !model) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Prepare file URLs if they are uploaded
    const fileUpdates = {};
    if (req.fileLocations) {
      if (req.fileLocations.dailyPricingFile) {
        fileUpdates.dailyPricingFile = req.fileLocations.dailyPricingFile;
      }
      if (req.fileLocations.twoToFourDaysPricingFile) {
        fileUpdates.twoToFourDaysPricingFile = req.fileLocations.twoToFourDaysPricingFile;
      }
      if (req.fileLocations.fiveToSevenDaysPricingFile) {
        fileUpdates.fiveToSevenDaysPricingFile = req.fileLocations.fiveToSevenDaysPricingFile;
      }
      if (req.fileLocations.eightToTwentySevenDaysPricingFile) {
        fileUpdates.eightToTwentySevenDaysPricingFile = req.fileLocations.eightToTwentySevenDaysPricingFile;
      }
      if (req.fileLocations.twentyEightPlusPricingFile) {
        fileUpdates.twentyEightPlusPricingFile = req.fileLocations.twentyEightPlusPricingFile;
      }
      if (req.fileLocations.image) {
        fileUpdates.image = req.fileLocations.image;
      }
    }

    // Check if a vehicle already exists for the given vname and model
    let existingVehicle = await NewVehicle.findOne({ vname, model });

    if (existingVehicle) {
      // Update the existing entry
      Object.assign(existingVehicle, { passenger, tagNumber, isAvailable }, fileUpdates);
      await existingVehicle.save();
      return res.status(200).json({ message: 'Vehicle updated successfully.', vehicle: existingVehicle });
    }

    const latestVehicle = await NewVehicle.findOne().sort({ createdAt: -1 }).select('vehicleID');
    const newIdNumber = latestVehicle && latestVehicle.vehicleID
      ? parseInt(latestVehicle.vehicleID.split('-')[1]) + 1
      : 1000000000;
    const vehicleID = `VEH-${newIdNumber}`;

    // Create a new vehicle entry if one doesn't exist
    const vehicleEntry = new NewVehicle({
      vehicleID,
      vname,
      passenger,
      tagNumber,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      model,
      ...fileUpdates,
    });

    const newVehicle = await vehicleEntry.save();

    res.status(201).json({
      message: 'Vehicle created successfully.',
      vehicle: {
        id: newVehicle._id,
        vehicleID: newVehicle.vehicleID,
        vname: newVehicle.vname,
        passenger: newVehicle.passenger,
        tagNumber: newVehicle.tagNumber,
        isAvailable: newVehicle.isAvailable,
        model: newVehicle.model,
        ...fileUpdates,
        createdAt: newVehicle.createdAt,
        updatedAt: newVehicle.updatedAt,
      },
    });
  } catch (err) {
    console.error("Error creating vehicle:", err);
    if (err.code === 11000 && err.keyPattern && err.keyPattern.tagNumber) {
      return res.status(400).json({ message: 'Tag number must be unique' });
    }
    res.status(500).json({ message: err.message });
  }
};


// Update 
exports.updateVehicle = async (req, res) => {
  const { vname, passenger, tagNumber, isAvailable, model } = req.body;
  const updateData = { vname, passenger, tagNumber, model };

  try {
    const existingVehicle = await NewVehicle.findById(req.params.id);
    if (!existingVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    // Prepare file URLs if they are uploaded
    if (req.fileLocations) {
      if (req.fileLocations.dailyPricingFile) {
        updateData.dailyPricingFile = req.fileLocations.dailyPricingFile;
      }
      if (req.fileLocations.twoToFourDaysPricingFile) {
        updateData.twoToFourDaysPricingFile = req.fileLocations.twoToFourDaysPricingFile;
      }
      if (req.fileLocations.fiveToSevenDaysPricingFile) {
        updateData.fiveToSevenDaysPricingFile = req.fileLocations.fiveToSevenDaysPricingFile;
      }
      if (req.fileLocations.eightToTwentySevenDaysPricingFile) {
        updateData.eightToTwentySevenDaysPricingFile = req.fileLocations.eightToTwentySevenDaysPricingFile;
      }
      if (req.fileLocations.twentyEightPlusPricingFile) {
        updateData.twentyEightPlusPricingFile = req.fileLocations.twentyEightPlusPricingFile;
      }
      if (req.fileLocations.image) {
        updateData.image = req.fileLocations.image;
      }
    } else {
      updateData.image = existingVehicle.image;
    }

    if (isAvailable !== undefined) {
      updateData.isAvailable = isAvailable;
    }

    const updatedVehicle = await NewVehicle.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({
      message: 'Vehicle updated successfully.',
      vehicle: updatedVehicle,
    });
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

    const vehicles = await NewVehicle.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const totalCount = await NewVehicle.countDocuments(searchQuery);

    const formattedVehicles = vehicles.map((vehicle) => ({
      ...vehicle.toObject(),
      image: vehicle.image,
      dailyPricingFile: vehicle.dailyPricingFile || null,
      twoToFourDaysPricingFile: vehicle.twoToFourDaysPricingFile || null,
      fiveToSevenDaysPricingFile: vehicle.fiveToSevenDaysPricingFile || null,
      eightToTwentySevenDaysPricingFile: vehicle.eightToTwentySevenDaysPricingFile || null,
      twentyEightPlusPricingFile: vehicle.twentyEightPlusPricingFile || null,
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
    const vehicle = await NewVehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    await NewVehicle.deleteOne({ _id: req.params.id });
    res.json({ message: "Vehicle deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getVehicleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await NewVehicle.findById(id).select(
      "vname passenger tagNumber model image dailyPricingFile twoToFourDaysPricingFile fiveToSevenDaysPricingFile eightToTwentySevenDaysPricingFile twentyEightPlusPricingFile"
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.status(200).json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle by ID:", error);
    res.status(500).json({ message: error.message });
  }
};


// csv pricing

// Helper function to parse a CSV file
const parseCSV = async (csvUrl) => {
  const data = [];
  const response = await axios.get(csvUrl, { responseType: 'stream' });

  return new Promise((resolve, reject) => {
    let rowCounter = 0; // To track row number
    let headers = []; // To store the actual headers

    response.data
      .pipe(csvParser({ headers: false })) // Parse without assuming headers initially
      .on('data', (row) => {
        rowCounter++;

        if (rowCounter === 1) {
          // Skip the first row (Sheet Title)
          return;
        } else if (rowCounter === 2) {
          // Row 2 contains the actual headers
          headers = Object.values(row).map((header) => header.trim());
          return;
        }

        // From row 3 onwards, process data using the extracted headers
        const parsedRow = {};
        Object.keys(row).forEach((key, index) => {
          const header = headers[index];
          const value = row[key]?.trim();
          if (header) {
            parsedRow[header] = value;
          }
        });

        data.push(parsedRow);
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

// Function to calculate total price from a pricing file
const calculateTotalVehiclePrice = async (csvUrl, startDate, endDate) => {
  const csvData = await parseCSV(csvUrl);

  // Convert CSV data into a usable format (pricing map)
  const pricingMap = {};
  csvData.forEach((row) => {
    const date = row['Dates Below']?.trim(); // Extract the day of the month
    Object.keys(row).forEach((key) => {
      if (key !== 'Dates Below') {
        const month = key.trim(); // Month vname (e.g., "January")
        const price = parseFloat(row[key]?.replace('$', '').trim() || 0); // Remove $ symbol and parse

        if (!pricingMap[month]) {
          pricingMap[month] = {};
        }
        pricingMap[month][date] = price; // Map month and day to price
      }
    });
  });

  // Calculate total price for the given date range
  let currentDate = new Date(startDate);
  let totalPrice = 0;

  while (currentDate <= endDate) {
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const day = currentDate.getDate().toString();

    if (pricingMap[month] && pricingMap[month][day]) {
      totalPrice += pricingMap[month][day];
    }

    // Move to the next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalPrice;
};

// Main API function to get pricing for all vehicles
exports.getvehiclePricing = async (req, res) => {
  try {
    const { days, pickdate, dropdate } = req.query;

    // Validate input
    if (!days || !pickdate || !dropdate) {
      return res.status(400).json({
        error: 'Please provide days, pickdate, and dropdate.',
      });
    }

    // Convert date inputs into proper Date objects
    const startDate = new Date(pickdate);
    const endDate = new Date(dropdate);

    // Check if the number of days matches the date range
    const dayDifference = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (dayDifference + 1 !== parseInt(days, 10)) {
      return res.status(400).json({
        error:
          'Number of days does not match the range between pickdate and dropdate.',
      });
    }

    // Fetch all vehicles from the database
    const vehicles = await NewVehicle.find();

    if (vehicles.length === 0) {
      return res.status(404).json({ error: 'No vehicles found.' });
    }

    // Process pricing for each vehicle
    const results = [];
    for (const vehicle of vehicles) {
      let csvUrl;

      // Determine the appropriate pricing file based on days
      if (days == 1) {
        csvUrl = vehicle.dailyPricingFile;
      } else if (days >= 2 && days <= 4) {
        csvUrl = vehicle.twoToFourDaysPricingFile;
      } else if (days >= 5 && days <= 7) {
        csvUrl = vehicle.fiveToSevenDaysPricingFile;
      } else if (days >= 8 && days <= 27) {
        csvUrl = vehicle.eightToTwentySevenDaysPricingFile;
      } else if (days >= 28) {
        csvUrl = vehicle.twentyEightPlusPricingFile;
      }

      // Skip vehicles without the appropriate pricing file
      if (!csvUrl) {
        results.push({
          vehicleId: vehicle._id,
          vname: vehicle.vname,
          image: vehicle.image,
          model: vehicle.model,
          passenger: vehicle.passenger,
          tagNumber: vehicle.tagNumber,
          isAvailable: vehicle.isAvailable,
          error: 'Pricing file not found for the specified number of days.',
        });
        continue;
      }

      // Calculate total price
      const totalPrice = await calculateTotalVehiclePrice(csvUrl, startDate, endDate);

      // Add the vehicle's details and pricing to the result
      results.push({
        vehicleId: vehicle._id,
        vname: vehicle.vname,
        image: vehicle.image,
        model: vehicle.model,
        passenger: vehicle.passenger,
        tagNumber: vehicle.tagNumber,
        isAvailable: vehicle.isAvailable,
        totalPrice: `$${totalPrice.toFixed(2)}`,
      });
    }

    // Return the pricing details for all vehicles
    res.status(200).json({ message: 'All Vehicle Pricing',results});
  } catch (err) {
    console.error(err); // Debug log the error
    res.status(500).json({ error: err.message });
  }
};

// single vehicle with pricing

exports.getVehicleWithPriceById = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { pickdate, dropdate } = req.query;

    // Validate input
    if (!vehicleId) {
      return res.status(400).json({
        error: "Please provide a vehicleId.",
      });
    }
    if (!pickdate || !dropdate) {
      return res.status(400).json({
        error: "Please provide pickdate and dropdate.",
      });
    }

    // Convert date inputs into proper Date objects
    const startDate = new Date(pickdate);
    const endDate = new Date(dropdate);

    // Ensure pickdate is not after dropdate
    if (startDate > endDate) {
      return res.status(400).json({
        error: "Pickdate must be on or before dropdate.",
      });
    }

    // Calculate the number of days (inclusive)
    const days = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    // Fetch the vehicle by ID
    const vehicle = await NewVehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        error: "Vehicle not found.",
      });
    }

    // Determine the appropriate pricing file based on days
    let csvUrl;
    if (days === 1) {
      csvUrl = vehicle.dailyPricingFile;
    } else if (days >= 2 && days <= 4) {
      csvUrl = vehicle.twoToFourDaysPricingFile;
    } else if (days >= 5 && days <= 7) {
      csvUrl = vehicle.fiveToSevenDaysPricingFile;
    } else if (days >= 8 && days <= 27) {
      csvUrl = vehicle.eightToTwentySevenDaysPricingFile;
    } else if (days >= 28) {
      csvUrl = vehicle.twentyEightPlusPricingFile;
    }

    // Validate pricing file
    if (!csvUrl) {
      return res.status(400).json({
        error: "No pricing file available for the specified duration.",
      });
    }

    // Calculate total price
    const totalPrice = await calculateTotalVehiclePrice(csvUrl, startDate, endDate);

    // Prepare response
    const response = {
      vehicleId: vehicle._id,
      vname: vehicle.vname,
      image: vehicle.image,
      model: vehicle.model,
      passenger: vehicle.passenger,
      tagNumber: vehicle.tagNumber,
      isAvailable: vehicle.isAvailable,
      totalPrice: `$${totalPrice.toFixed(2)}`,
    };

    // Send response
    res.status(200).json({
      message: "Vehicle details with pricing fetched successfully.",
      data: response,
    });
  } catch (err) {
    console.error(err); // Debug log the error
    res.status(500).json({ error: err.message });
  }
};