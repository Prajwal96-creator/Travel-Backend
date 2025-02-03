const cron = require('node-cron');
const { Trip } = require('../models/models');
const nodemailer = require('nodemailer');

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMIAL,
    pass: process.env.SMTP_PASS
  }
});
console.log(process.env.APP_URL)
// Verify email configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP Connection Error:', error);
  } else {
    console.log('SMTP Server is ready to take messages');
    console.log('Using email:', process.env.SMTP_EMIAL);
  }
});

// Function to send arrival confirmation email
async function sendArrivalConfirmationEmail(trip, studentEmail) {
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: studentEmail,
    subject: 'Arrival Confirmation Request',
    html: `
      <h3>Dear Student,</h3>
      <p>As per your scheduled arrival time of ${new Date(trip.flightDetails.scheduledArrivalTime).toLocaleString()}, 
         you might have reached your destination at ${trip.flightDetails.arrivalAirport}.</p>
      <p>Please confirm your arrival status by selecting one of the following options:</p>
      <div style="margin: 20px 0;">
        <p><a href="${process.env.APP_URL || 'http://localhost:5000'}/api/trips/${trip._id}/confirm-arrival?preference=IMMEDIATE" 
              style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; margin: 5px 0; display: inline-block;">
           Arrived - Notify Now</a></p>
        <p><a href="${process.env.APP_URL || 'http://localhost:5000'}/api/trips/${trip._id}/confirm-arrival?preference=DELAY_5MIN" 
              style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; margin: 5px 0; display: inline-block;">
           Arrived - Notify in 5 minutes</a></p>
        <p><a href="${process.env.APP_URL || 'http://localhost:5000'}/api/trips/${trip._id}/confirm-arrival?preference=DELAY_30MIN" 
              style="background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; margin: 5px 0; display: inline-block;">
           Arrived - Notify in 30 minutes</a></p>
        <p><a href="${process.env.APP_URL || 'http://localhost:5000'}/api/trips/${trip._id}/confirm-arrival?preference=DO_NOT_NOTIFY" 
              style="background-color: #f44336; color: white; padding: 10px 20px; text-decoration: none; margin: 5px 0; display: inline-block;">
           Don't Notify</a></p>
      </div>
      <p>If you haven't arrived yet, please ignore this email.</p>
    `
  };
console.log(process.env.APP_URL)
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Arrival confirmation email sent to ${studentEmail} for trip ${trip._id}`);

    // Mark that the arrival email has been sent
    await Trip.findByIdAndUpdate(trip._id, {
      'notificationStatus.arrivalEmailSent': true,
      'notificationStatus.arrivalEmailSentAt': new Date()
    });
  } catch (error) {
    console.error(`❌ Failed to send arrival confirmation email for trip ${trip._id}:`, error);
    throw error;
  }
}

// 🔄 **Scheduled Cron Job (Runs Every Minute)**
cron.schedule('* * * * *', async () => {
  const currentTime = new Date();
  console.log('⏳ Running arrival notification check:', currentTime.toISOString());

  try {
    // ✅ **Find only trips where arrival email has NOT been sent**
    const pendingTrips = await Trip.find({
      'arrivalConfirmation.isConfirmed': false,
      'notificationStatus.arrivalEmailSent': false, // ⬅️ Ensure email is not already sent
      'flightDetails.scheduledArrivalTime': { $lte: currentTime } // ⬅️ Only pick trips where arrival time has passed
    }).populate('student');

    console.log(`🚀 Found ${pendingTrips.length} trips that need arrival notifications.`);

    for (const trip of pendingTrips) {
      if (!trip.student) {
        console.error(`⚠️ No student found for trip ${trip._id}, skipping.`);
        continue;
      }

      try {
        await sendArrivalConfirmationEmail(trip, trip.student.email);
      } catch (error) {
        console.error(`❌ Error processing trip ${trip._id}:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error('❌ Error in arrival notification cron job:', error);
  }
});
