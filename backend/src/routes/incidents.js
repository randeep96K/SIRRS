const express = require('express');
const {
  createIncident,
  getIncidents,
  getIncident,
  updateStatus,
  uploadResolutionPhotos
} = require('../controllers/incidentController');
const { protect, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/multer');

const router = express.Router();

router.post('/', protect, upload.array('photos', 5), createIncident);
router.get('/', protect, getIncidents);
router.get('/:id', protect, getIncident);
router.patch('/:id/status', protect, authorizeRoles('authority', 'admin'), updateStatus);
router.post('/:id/photos', protect, authorizeRoles('authority', 'admin'), upload.array('photos', 5), uploadResolutionPhotos);

module.exports = router;