const Incident = require('../models/Incident');
const { categorize } = require('../utils/aiCategorizer');

// ------------------------ CREATE INCIDENT ------------------------
exports.createIncident = async (req, res) => {
  try {
    const { title, description, category, lat, lng, address, deadline } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Location coordinates are required' });
    }

    const finalCategory = category || categorize(description);

    const photoUrls = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

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
      timeline: [
        {
          status: 'pending',
          note: 'Incident reported',
          updatedBy: req.user.id
        }
      ]
    });

    const populatedIncident = await Incident.findById(incident._id)
      .populate('reporter', 'name email');

    res.status(201).json({
      success: true,
      incident: populatedIncident,
      aiSuggestion: !category ? finalCategory : null
    });
  } catch (error) {
    console.error('❌ createIncident error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ------------------------ GET ALL INCIDENTS ------------------------
exports.getIncidents = async (req, res) => {
  try {
    console.log('🔎 /api/incidents hit by', req.user?.email, req.user?.role);

    const { status, category, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (category) query.category = category;

    // citizens can only see their own
    if (req.user.role === 'citizen') query.reporter = req.user.id;

    const incidents = await Incident.find(query)
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Incident.countDocuments(query);

    console.log('✅ getIncidents return', incidents.length, 'records');

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
    console.error('❌ getIncidents error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ------------------------ GET SINGLE INCIDENT ------------------------
exports.getIncident = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reporter', 'name email phone')
      .populate('timeline.updatedBy', 'name role');

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    if (
      req.user.role === 'citizen' &&
      incident.reporter._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ error: 'Not authorized to view this incident' });
    }

    res.json({ success: true, incident });
  } catch (error) {
    console.error('❌ getIncident error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ------------------------ UPDATE STATUS ------------------------
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

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

    res.json({ success: true, incident: updatedIncident });
  } catch (error) {
    console.error('❌ updateStatus error:', error);
    res.status(500).json({ error: error.message });
  }
};

// ------------------------ UPLOAD RESOLUTION PHOTOS ------------------------
exports.uploadResolutionPhotos = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const photoUrls = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : [];

    incident.resolutionPhotos.push(...photoUrls);
    await incident.save();

    res.json({ success: true, photos: photoUrls, incident });
  } catch (error) {
    console.error('❌ uploadResolutionPhotos error:', error);
    res.status(500).json({ error: error.message });
  }
};