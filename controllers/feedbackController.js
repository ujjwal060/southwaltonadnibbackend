const Feedback = require("../models/feedbackModel");


//create
exports.createFeedback = async (req, res) => {
    console.log(req.body);
    const {  name, email, startDate, endDate, comments } = req.body;
    
    const feedbackEntry = new Feedback({
        name,
        email,
        startDate,
        endDate,
        comments,
      });
    try {
      const newFeedback = await feedbackEntry.save();
      res.status(201).json(newFeedback);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  };

  //get

  exports.getFeedback = async (req, res) => {
    try {
      let feedbackEntry = await Feedback.find();
      res.json(feedbackEntry);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  //delete

  exports.deleteFeedback = async (req, res) => {
    try {
      const feedbackEntry = await Feedback.findById(req.params.id);
      if (!feedbackEntry) {
        return res.status(404).json({ message: "Feedback not found" });
      }
      await Feedback.deleteOne({ _id: req.params.id });
      res.json({ message: "Feedback deleted" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

