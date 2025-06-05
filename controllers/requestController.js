const Request = require('../models/requestModel');
const createError = require('../middleware/error')
const createSuccess = require('../middleware/success')


exports.getAllRequests = async (req, res, next) => {
    try {

      const { page = 1, limit = 10, search = '' } = req.query;
  
      const searchFilter = search 
        ? { $or: [{ email: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }] }
        : {};
      const totalCount = await Request.countDocuments(searchFilter);
  
      const requests = await Request.find(searchFilter)
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
  
      return next(createSuccess(200, "All requests", {
        totalCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        data: requests
      }));
    } catch (error) {
      return next(createError(500, "Internal Server Error!"));
    }
  };
  

exports.deleteRequest = async (req, res, next) => {
  try {
      const { id } = req.params;
      const request = await Request.findByIdAndDelete(id);
      if (!request) {
          return next(createError(404, "Request Not Found"));
      }
      return next(createSuccess(200, "Request Deleted", request));
  } catch (error) {
      return next(createError(500, "Internal Server Error1"))
  }
}