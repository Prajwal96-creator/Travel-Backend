const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Student Schema
const studentSchema = new Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passportNumber: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  emergencyContact: {
    name: {
      type: String,
      required: true
    },
    relationship: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  trips: [{
    type: Schema.Types.ObjectId,
    ref: 'Trip'
  }]
}, {
  timestamps: true
});

// Trip Schema
const tripSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  flightDetails: {
    flightNumber: {
      type: String,
      required: true
    },
    airline: {
      type: String,
      required: true
    },
    departureAirport: {
      type: String,
      required: true
    },
    arrivalAirport: {
      type: String,
      required: true
    },
    scheduledDepartureTime: {
      type: Date,
      required: true
    },
    scheduledArrivalTime: {
      type: Date,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'CANCELLED'],
    default: 'SCHEDULED'
  },
  arrivalConfirmation: {
    isConfirmed: {
      type: Boolean,
      default: false
    },
    actualArrivalTime: Date,
    confirmationTime: Date,
    notificationPreference: {
      type: String,
      enum: ['IMMEDIATE', 'DELAY_5MIN', 'DELAY_30MIN', 'DO_NOT_NOTIFY'],
      default: 'IMMEDIATE'
    }
  },
  notificationStatus: {
    arrivalEmailSent: {
      type: Boolean,
      default: false
    },
    arrivalEmailSentAt: Date,
    relativeNotified: {
      type: Boolean,
      default: false
    },
    relativeNotifiedAt: Date
  }
}, {
  timestamps: true
});

// Notification Log Schema (for tracking all email notifications)
const notificationLogSchema = new Schema({
  trip: {
    type: Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  type: {
    type: String,
    enum: ['ARRIVAL_CONFIRMATION_REQUEST', 'RELATIVE_NOTIFICATION'],
    required: true
  },
  recipient: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'SENT', 'FAILED'],
    default: 'PENDING'
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  sentAt: Date,
  error: String
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);
const Trip = mongoose.model('Trip', tripSchema);
const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

module.exports = {
  Student,
  Trip,
  NotificationLog
};