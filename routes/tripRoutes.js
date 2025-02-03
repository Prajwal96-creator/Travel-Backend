const express = require('express');
const {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  confirmArrival,
  notifyRelative
} = require('../controllers/tripController');

const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, createTrip);
router.get('/', authMiddleware, getTrips);
router.get('/:tripId', authMiddleware, getTripById);
router.put('/:tripId', authMiddleware, updateTrip);
router.delete('/:tripId', authMiddleware, deleteTrip);

router.post('/:tripId/confirm-arrival', authMiddleware, confirmArrival);
router.post('/:tripId/notify-relative', authMiddleware, notifyRelative);

const arrivalTime = new Date(Date.now() + 4 * 60 * 1000);
console.log(arrivalTime)

module.exports = router;
