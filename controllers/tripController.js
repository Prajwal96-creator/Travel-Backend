const { Trip, Student, NotificationLog } = require('../models/models');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Nodemailer setup using SMTP credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMIAL,
    pass: process.env.SMTP_PASS
  }
});

// Create a new trip
exports.createTrip = async (req, res) => {
  try {
    const { flightDetails } = req.body;
    const studentId = req.student.id;

    const trip = new Trip({
      student: studentId,
      flightDetails
    });

    await trip.save();

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all trips for logged-in student
exports.getTrips = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { student: req.student.id };
    if (status) query.status = status;

    const trips = await Trip.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get specific trip by ID
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('student');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    res.status(200).json(trip);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a trip
exports.updateTrip = async (req, res) => {
  try {
    const updatedTrip = await Trip.findByIdAndUpdate(req.params.tripId, req.body, { new: true, runValidators: true });
    if (!updatedTrip) return res.status(404).json({ message: 'Trip not found' });

    res.status(200).json(updatedTrip);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a trip
exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.tripId);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    res.status(200).json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Confirm arrival of student
// const nodemailer = require('nodemailer');

// const nodemailer = require('nodemailer');

// Nodemailer transporter setup


// Function to send an email with a delay
const sendEmailWithDelay = (mailOptions, delayInMinutes) => {
  setTimeout(async () => {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${mailOptions.to} after ${delayInMinutes} minutes`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${mailOptions.to}:`, error);
    }
  }, delayInMinutes * 60 * 1000); // Convert minutes to milliseconds
};

exports.confirmArrival = async (req, res) => {
  try {
    const { preference } = req.body;

    // Validate preference
    const validPreferences = ['IMMEDIATE', 'DELAY_5MIN', 'DELAY_30MIN', 'DO_NOT_NOTIFY'];
    if (!validPreferences.includes(preference)) {
      return res.status(400).json({ message: 'Invalid preference' });
    }

    // Find the trip and populate student details including emergency contact
    const trip = await Trip.findById(req.params.tripId).populate('student');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Ensure student exists
    if (!trip.student) {
      return res.status(404).json({ message: 'Student not found for this trip' });
    }

    // Ensure emergency contact exists
    if (!trip.student.emergencyContact || !trip.student.emergencyContact.email) {
      return res.status(400).json({ message: 'Emergency contact email is missing' });
    }

    // Update trip details
    trip.arrivalConfirmation.isConfirmed = true;
    trip.arrivalConfirmation.notificationPreference = preference;
    trip.arrivalConfirmation.actualArrivalTime = new Date();
    trip.arrivalConfirmation.confirmationTime = new Date();

    await trip.save(); // Save changes before sending emails

    // Email options for student
    const studentMailOptions = {
      from: process.env.SMTP_EMAIL,
      to: trip.student.email,
      subject: 'Arrival Confirmation',
      text: `Your arrival has been confirmed with ${preference} preference.`
    };

    // Email options for relative (emergency contact)
    const relativeMailOptions = {
      from: process.env.SMTP_EMAIL,
      to: trip.student.emergencyContact.email,
      subject: 'Student Arrival Notification',
      text: `Dear ${trip.student.emergencyContact.name},\n\nYour relative ${trip.student.firstName} ${trip.student.lastName} has confirmed their arrival at ${trip.flightDetails.arrivalAirport}.\n\nConfirmation Time: ${trip.arrivalConfirmation.confirmationTime}.\n\nBest regards,\nTrip Management System`
    };

    // Determine delay time based on preference
    let delayMinutes = 0;
    if (preference === 'DELAY_5MIN') delayMinutes = 5;
    else if (preference === 'DELAY_30MIN') delayMinutes = 30;

    if (preference !== 'DO_NOT_NOTIFY') {
      // Send emails with delay based on preference
      sendEmailWithDelay(studentMailOptions, delayMinutes);
      sendEmailWithDelay(relativeMailOptions, delayMinutes);
    }

    // Mark relative as notified (only if not "DO_NOT_NOTIFY")
    if (preference !== 'DO_NOT_NOTIFY') {
      trip.notificationStatus.relativeNotified = true;
      trip.notificationStatus.relativeNotifiedAt = new Date(Date.now() + delayMinutes * 60 * 1000); // Add delay to timestamp
      await trip.save(); // Save after scheduling notification
    }

    // Return updated trip data
    res.status(200).json({ message: `Arrival confirmed with ${preference} preference`, trip });

  } catch (error) {
    console.error('Error during arrival confirmation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};



// Notify relative about arrival
exports.notifyRelative = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('student');
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const { emergencyContact } = trip.student;

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: emergencyContact.email,
      subject: 'Student Arrival Notification',
      text: `Hello ${emergencyContact.name},\n\nYour relative has arrived at ${trip.flightDetails.arrivalAirport}.`
    };

    await transporter.sendMail(mailOptions);

    // Log notification status
    const notificationLog = new NotificationLog({
      trip: trip._id,
      type: 'RELATIVE_NOTIFICATION',
      recipient: emergencyContact.email,
      status: 'SENT',
      scheduledFor: new Date()
    });

    await notificationLog.save();

    trip.notificationStatus.relativeNotified = true;
    trip.notificationStatus.relativeNotifiedAt = new Date();
    await trip.save();

    res.status(200).json({ message: 'Relative notified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
