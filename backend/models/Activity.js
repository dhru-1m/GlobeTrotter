const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    required: true
  },
  destination: {
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    }
  },
  title: {
    type: String,
    required: [true, 'Activity title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  type: {
    type: String,
    enum: ['sightseeing', 'food', 'adventure', 'culture', 'shopping', 'relaxation', 'transport', 'other'],
    default: 'other'
  },
  date: {
    type: Date,
    required: [true, 'Activity date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time (HH:MM)']
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  dayOrder: {
    type: Number,
    default: 0
  },
  location: {
    name: {
      type: String,
      required: true
    },
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  cost: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
    },
    perPerson: {
      type: Boolean,
      default: true
    }
  },
  booking: {
    required: {
      type: Boolean,
      default: false
    },
    confirmed: {
      type: Boolean,
      default: false
    },
    reference: String,
    notes: String
  },
  images: [{
    url: String,
    caption: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  isFlexible: {
    type: Boolean,
    default: false
  },
  weatherDependent: {
    type: Boolean,
    default: false
  },
  maxParticipants: {
    type: Number,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 1,
    min: 1
  }
}, {
  timestamps: true
});

// Calculate duration from start and end time
activitySchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const start = new Date(`2000-01-01T${this.startTime}:00`);
    const end = new Date(`2000-01-01T${this.endTime}:00`);
    this.duration = Math.round((end - start) / (1000 * 60)); // Convert to minutes
  }
  next();
});

// Validate time logic
activitySchema.pre('save', function(next) {
  if (this.startTime && this.endTime) {
    const start = new Date(`2000-01-01T${this.startTime}:00`);
    const end = new Date(`2000-01-01T${this.endTime}:00`);
    if (end <= start) {
      next(new Error('End time must be after start time'));
    }
  }
  next();
});

// Index for better query performance
activitySchema.index({ trip: 1, date: 1, startTime: 1 });
activitySchema.index({ destination: 1, type: 1 });
activitySchema.index({ date: 1, type: 1 });

module.exports = mongoose.model('Activity', activitySchema); 