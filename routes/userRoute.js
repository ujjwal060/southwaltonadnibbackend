const express = require("express");
const { register, getAllUsers, getUserById,getStatus, updateUser, deleteUser, activate } = require('../controllers/userController');
const { verifyAdmin, verifyUser } = require('../middleware/verifyToken');
const router = express.Router();

// Register a new user (without image upload)
router.post('/register', verifyAdmin, register);

// Get all users
router.get('/', verifyAdmin, getAllUsers);

// Get user by ID
router.get('/:id', verifyUser, getUserById);

// Update user by ID (without image upload)
router.put('/:id', verifyAdmin, updateUser);

// Delete user by ID
router.delete('/:id', verifyAdmin, deleteUser);

// Activate user
router.post('/status', verifyAdmin, activate);

//getStatus
router.get('/status/:email', getStatus);

module.exports = router;
