const Image = require('../models/signModel');
const User = require('../models/userModel')


//delete
exports.deleteSignature = async (req, res) => {
    try {
        const { id } = req.params; // Extract id from request params
        const deletedSignature = await Image.findOneAndDelete({ _id: id }); // Use _id for MongoDB
  
        if (!deletedSignature) {
            return res.status(404).json({ message: 'Signature not found' });
        }
  
        return res.status(200).json({ message: 'Signature deleted successfully' });
    } catch (error) {
        return res.status(500).json({ message: 'Failed to delete signature', error });
    }
  };
  


exports.getAllImages = async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query; // Pagination and search parameters

    try {
        // Aggregate pipeline for search and pagination
        const allImages = await Image.aggregate([
            {
                $lookup: {
                    from: "users", // The name of the User collection
                    localField: "userId",
                    foreignField: "_id",
                    as: "userDetails",
                },
            },
            {
                $unwind: "$userDetails", // Flatten userDetails array
            },
            {
                $match: search
                    ? { "userDetails.email": { $regex: search, $options: "i" } }
                    : {}, // Match user email based on search
            },
            {
                $sort: { createdAt: -1 }, // Sort by createdAt in descending order
            },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $skip: (page - 1) * parseInt(limit) },
                        { $limit: parseInt(limit) },
                    ],
                },
            },
        ]);

        const metadata = allImages[0]?.metadata[0] || { total: 0 };
        const data = allImages[0]?.data || [];

        // If no images found
        if (allImages.length === 0) {
            return res.status(200).json({
              success: true,
              message: 'No image records found.',
              data: [],
              totalPages: 0,
            });
          }
          

        // Return images with pagination metadata
        return res.status(200).json({
            success: true,
            message: 'All image records retrieved successfully.',
            total: metadata.total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(metadata.total / limit),
            data,
        });
    } catch (error) {
        console.error('Error retrieving all image records:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error.',
            details: error.message,
        });
    }
};
