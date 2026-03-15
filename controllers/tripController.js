const Trip = require('../models/Trip');

exports.getAllTrips = async (req, res) => {
  try {
    const { search, location, minPrice, maxPrice, category } = req.query;
    let filter = { isActive: true };
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
      { to: { $regex: search, $options: 'i' } },
    ];
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    const trips = await Trip.find(filter).sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAllTripsAdmin = async (req, res) => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createTrip = async (req, res) => {
  try {
    const data = req.body;
    if (req.files && req.files.length > 0) {
      data.images = req.files.map(f => `/uploads/${f.filename}`);
    }
    if (typeof data.highlights === 'string' && data.highlights.trim()) {
      try {
        // Try parsing if it's JSON stringified from frontend
        const parsed = JSON.parse(data.highlights);
        data.highlights = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        // Fallback to comma split
        data.highlights = data.highlights.split(',').map(h => h.trim()).filter(h => h);
      }
    }
    const trip = await Trip.create(data);
    res.status(201).json(trip);
  } catch (err) {
    console.error('Create Trip Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    
    const data = req.body;
    let images = [];

    // Parse existing images if provided
    if (data.existingImages) {
      try {
        images = JSON.parse(data.existingImages);
      } catch (e) {
        images = [];
      }
    }

    // Add new uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => `/uploads/${f.filename}`);
      images = [...images, ...newImages];
    }
    
    data.images = images;

    if (typeof data.highlights === 'string' && data.highlights.trim()) {
      try {
        const parsed = JSON.parse(data.highlights);
        data.highlights = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        data.highlights = data.highlights.split(',').map(h => h.trim()).filter(h => h);
      }
    }

    Object.assign(trip, data);
    const updatedTrip = await trip.save();
    res.json(updatedTrip);
  } catch (err) {
    console.error('Update Trip Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTrip = async (req, res) => {
  try {
    const trip = await Trip.findByIdAndDelete(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json({ message: 'Trip deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
