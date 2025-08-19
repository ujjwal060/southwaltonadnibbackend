const NewVehicle = require("../models/newVehicleModel");

const mongoose = require("mongoose");
const axios = require("axios");
const csvParser = require("csv-parser");

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
        fileUpdates.twoToFourDaysPricingFile =
          req.fileLocations.twoToFourDaysPricingFile;
      }
      if (req.fileLocations.fiveToSevenDaysPricingFile) {
        fileUpdates.fiveToSevenDaysPricingFile =
          req.fileLocations.fiveToSevenDaysPricingFile;
      }
      if (req.fileLocations.eightToTwentySevenDaysPricingFile) {
        fileUpdates.eightToTwentySevenDaysPricingFile =
          req.fileLocations.eightToTwentySevenDaysPricingFile;
      }
      if (req.fileLocations.twentyEightPlusPricingFile) {
        fileUpdates.twentyEightPlusPricingFile =
          req.fileLocations.twentyEightPlusPricingFile;
      }
      if (req.fileLocations.image) {
        fileUpdates.image = req.fileLocations.image;
      }
    }

    // Check if a vehicle already exists for the given vname and model
    let existingVehicle = await NewVehicle.findOne({ vname, model });

    if (existingVehicle) {
      // Update the existing entry
      Object.assign(
        existingVehicle,
        { passenger, tagNumber, isAvailable },
        fileUpdates
      );
      await existingVehicle.save();
      return res.status(200).json({
        message: "Vehicle updated successfully.",
        vehicle: existingVehicle,
      });
    }

    const latestVehicle = await NewVehicle.findOne()
      .sort({ createdAt: -1 })
      .select("vehicleID");
    const newIdNumber =
      latestVehicle && latestVehicle.vehicleID
        ? parseInt(latestVehicle.vehicleID.split("-")[1]) + 1
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
      message: "Vehicle created successfully.",
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
      return res.status(400).json({ message: "Tag number must be unique" });
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
        updateData.twoToFourDaysPricingFile =
          req.fileLocations.twoToFourDaysPricingFile;
      }
      if (req.fileLocations.fiveToSevenDaysPricingFile) {
        updateData.fiveToSevenDaysPricingFile =
          req.fileLocations.fiveToSevenDaysPricingFile;
      }
      if (req.fileLocations.eightToTwentySevenDaysPricingFile) {
        updateData.eightToTwentySevenDaysPricingFile =
          req.fileLocations.eightToTwentySevenDaysPricingFile;
      }
      if (req.fileLocations.twentyEightPlusPricingFile) {
        updateData.twentyEightPlusPricingFile =
          req.fileLocations.twentyEightPlusPricingFile;
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

    const updatedVehicle = await NewVehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({
      message: "Vehicle updated successfully.",
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
            { tagNumber: { $regex: search, $options: "i" } },
          ],
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
      eightToTwentySevenDaysPricingFile:
        vehicle.eightToTwentySevenDaysPricingFile || null,
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
const parseCSV = async (csvUrl) => {
  const data = [];
  const response = await axios.get(csvUrl, { responseType: "stream" });
  return new Promise((resolve, reject) => {
    response.data
      .pipe(csvParser())
      .on("data", (row) => {
        data.push(row);
      })
      .on("end", () => {
        resolve(data);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

const calculateTotalVehiclePrice = async (
  csvUrl,
  startDate,
  endDate,
  vehicleType
) => {
  const csvData = await parseCSV(csvUrl);
  const pricingMap = {};

  // csvData.forEach((row) => {
  //   const fullDate = row["Date"]?.trim();
  //   const price = parseFloat(row[vehicleType]?.trim());

  //   if (fullDate && !isNaN(price)) {
  //     const formattedDate = new Date(fullDate).toISOString().split("T")[0];
  //     pricingMap[formattedDate] = price;
  //   }
  // });

  csvData.forEach((row) => {
    const fullDate =
      row["Date"]?.trim() ||
      row["2-5 daily rate"]?.trim() ||
      row["6-7 daily rate"]?.trim() ||
      row["8-14 daily rate"]?.trim();

    const price = parseFloat(row[vehicleType]?.trim());

    if (fullDate && !isNaN(price)) {
      const formattedDate = new Date(fullDate).toISOString().split("T")[0];
      pricingMap[formattedDate] = price;
    }
  });

  let currentDate = new Date(startDate);
  let totalPrice = 0;

  while (currentDate <= endDate) {
    const formattedDate = currentDate.toISOString().split("T")[0];

    if (pricingMap[formattedDate]) {
      totalPrice += pricingMap[formattedDate];
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return totalPrice;
};

const buildVehicleData = async (vehicle, startDate, endDate, days) => {
  let csvUrl;

  if (days == 1) {
    csvUrl = vehicle.dailyPricingFile;
  } else if (days >= 2 && days <= 5) {
    csvUrl = vehicle.twoToFourDaysPricingFile;
  } else if (days >= 6 && days <= 7) {
    csvUrl = vehicle.fiveToSevenDaysPricingFile;
  } else if (days >= 8 && days <= 14) {
    csvUrl = vehicle.eightToTwentySevenDaysPricingFile;
  }

  let vehicleType;
  if (vehicle.passenger === "fourPassenger") {
    vehicleType = "4p gas/electric";
  } else if (vehicle.passenger === "sixPassenger") {
    vehicleType = "6p gas/electric";
  } else if (vehicle.passenger === "eightPassenger") {
    vehicleType = "8p electric only";
  }

  const totalPrice =
    csvUrl && vehicleType
      ? await calculateTotalVehiclePrice(csvUrl, startDate, endDate, vehicleType)
      : 0;

  return {
    vehicleId: vehicle._id,
    vname: vehicle.vname,
    image: vehicle.image,
    model: vehicle.model,
    passenger: vehicle.passenger,
    tagNumber: vehicle.tagNumber,
    isAvailable: vehicle.isAvailable,
    totalPrice: `$${totalPrice.toFixed(2)}`
  };
};

exports.getvehiclePricing = async (req, res) => {
  try {
    const { days, pickdate, dropdate, model, passenger } = req.query;

    if (!days || !pickdate || !dropdate) {
      return res.status(400).json({
        error: "Please provide days, pickdate, and dropdate.",
      });
    }

    const startDate = new Date(pickdate);
    const endDate = new Date(dropdate);

    const dayDifference = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDifference + 1 !== parseInt(days, 10)) {
      return res.status(400).json({
        error:
          "Number of days does not match the range between pickdate and dropdate.",
      });
    }

    const vehicles = await NewVehicle.find({ model, passenger });
    const suggestionVehicles = await NewVehicle.find({});

    if (vehicles.length === 0) {
      return res.status(404).json({ error: "No vehicles found." });
    }

    const results = await Promise.all(
      vehicles.map((v) => buildVehicleData(v, startDate, endDate, days))
    );

    const suggestions = await Promise.all(
      suggestionVehicles.map((v) =>
        buildVehicleData(v, startDate, endDate, days)
      )
    );

    res
      .status(200)
      .json({ message: "All Vehicle Pricing", results, suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
    const days =
      Math.ceil(
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
    const totalPrice = await calculateTotalVehiclePrice(
      csvUrl,
      startDate,
      endDate
    );

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
