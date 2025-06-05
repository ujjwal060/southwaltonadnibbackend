const User = require('../models/userModel');
const Role = require('../models/roleModel');
const createError = require('../middleware/error');
const createSuccess = require('../middleware/success');

// To create user
const register = async (req, res, next) => {
  try {
    const role = await Role.findOne({ role: 'User' });
    if (!role) {
      return next(createError(400, "Role not found"));
    }
    const { fullName, email, password, phoneNumber, state } = req.body;

    if (!fullName || !email || !password) {
      return next(createError(400, "Name, Email, and Password are required"));
    }

    const newUser = new User({ fullName, email, password, phoneNumber, state, roles: [role._id] });
    const savedUser = await newUser.save();

    return next(createSuccess(200, "User Registered Successfully", savedUser));
  } catch (error) {
    console.error(error);
    return next(createError(500, "Something went wrong"));
  }
};

// Activate user
const activate = async (req, res, next) => {
  try {
    const { id, status } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return next(createError(404, "User not found"));
    }

    user.isActive = status;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile status updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return next(createError(500, "Something went wrong"));
  }
};


//getStatus
const getStatus = async (req, res, next) => {
  try {
    const { email } = req.params;


    // Search for the user by the exact email provided
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found");
      return next(createError(404, "User Not Found"));
    }


    return next(createSuccess(200, "User status retrieved", { isActive: user.isActive }));
  } catch (error) {
    console.error("Error retrieving user status:", error);
    return next(createError(500, "Internal Server Error!"));
  }
};


// Get all users
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, query = "" } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Create a search filter
    const searchFilter = query
      ? {
        $or: [
          { fullName: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
          { phoneNumber: { $regex: query, $options: "i" } },
          { state: { $regex: query, $options: "i" } }
        ]
      }
      : {};

    // Calculate total count and fetch users with pagination and search
    const totalUsers = await User.countDocuments(searchFilter);
    const users = await User.find(searchFilter)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);

    // Prepare response
    const response = {
      totalUsers,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalUsers / limitNumber),
      users,
    };

    return next(createSuccess(200, "All Users", response));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};


// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return next(createError(404, "User Not Found"));
    }

    return next(createSuccess(200, "User found", user));
  } catch (error) {
    console.error(error);
    return next(createError(500, "Internal Server Error!"));
  }
};

// Update user by ID
const updateUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { fullName, email, password, phoneNumber, state, roles } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User Not Found"));
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.password = password || user.password;
    user.phoneNumber = phoneNumber || user.phoneNumber;
    user.state = state || user.state;
    user.roles = roles || user.roles;

    const updatedUser = await user.save();
    return next(createSuccess(200, "User Details Updated successfully", updatedUser));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"));
  }
};

// Delete user by ID
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return next(createError(404, "User Not Found"));
    }
    return next(createSuccess(200, "User Deleted", user));
  } catch (error) {
    return next(createError(500, "Internal Server Error!"))
  }
};

module.exports = { register, getAllUsers, getStatus, getUserById, updateUser, deleteUser, activate };
