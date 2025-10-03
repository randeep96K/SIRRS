const Incident = require('../models/Incident');
const { categorize } = require('../utils/aiCategorizer');

// @desc    Create new incident
// @route   POST /api/incidents
// @access  Private
exports.createIncident = async (req, res) => {
  try {
    const { title, description, category, lat, lng, address, deadline } = req.body;

    // Validate coordinates
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    // Use AI categorizer if category not provided
    const finalCategory = category || categorize(description);

    // Process uploaded photos
    const photoUrls = req.files ? req.files.map(file => {
      return `/uploads/${file.filename}`;
    }) : [];

    // Create incident
    const incident = await Incident.create({
      title,
      description,
      category: finalCategory,
      photos: photoUrls,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
        address
      },
      reporter: req.user.id,
      deadline: deadline ? new Date(deadline) : undefined,
      timeline: [{
        status: 'pending',
        note: 'Incident reported',
        updatedBy: req.user.id
      }]
    });

    const populatedIncident = await Incident.findById(incident._id).populate('reporter', 'name email');

    res.status(201).json({
      success: true,
      incident: populatedIncident,
      aiSuggestion: !category ? finalCategory : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all incidents with filters
// @route   GET /api/incidents
// @access  Private
exports.getIncidents = async (req, res) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    // For citizens, show only their own incidents
    if (req.user.role === 'citizen') {
      query.reporter = req.user.id;
    }

    const incidents = await Incident.find(query)
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Incident.countDocuments(query);

    res.json({
      success: true,
      incidents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get single incident
// @route   GET /api/incidents/:id
// @access  Private
exports.getIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reporter', 'name email phone')
      .populate('timeline.updatedBy', 'name role');

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Citizens can only view their own incidents
    if (req.user.role === 'citizen' && incident.reporter._id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this incident' });
    }

    res.json({
      success: true,
      incident
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update incident status
// @route   PATCH /api/incidents/:id/status
// @access  Private (Authority/Admin only)
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Update status and add to timeline
    incident.status = status;
    incident.timeline.push({
      status,
      note: note || `Status changed to ${status}`,
      updatedBy: req.user.id
    });

    await incident.save();

    const updatedIncident = await Incident.findById(incident._id)
      .populate('reporter', 'name email')
      .populate('timeline.updatedBy', 'name role');

    res.json({
      success: true,
      incident: updatedIncident
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Upload resolution photos
// @route   POST /api/incidents/:id/photos
// @access  Private (Authority/Admin only)
exports.uploadResolutionPhotos = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    // Process uploaded photos
    const photoUrls = req.files ? req.files.map(file => {
      return `/uploads/${file.filename}`;
    }) : [];

    incident.resolutionPhotos.push(...photoUrls);
    await incident.save();

    res.json({
      success: true,
      photos: photoUrls,
      incident
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    // existing code ...
  } catch (error) {
    console.error("❌ Error in getIncidents:", error);  // ADD THIS
    res.status(500).json({ error: error.message });
  }
};