const mongoose = require("mongoose");

const MeetingSchema = require("../schema/MeetingSchema");

const meetingModel = mongoose.model("meeting", MeetingSchema);

module.exports = meetingModel;