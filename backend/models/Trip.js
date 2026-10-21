const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Trip name is required'],
    trim: true,
    maxlength: [100, 'Trip name cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  coverPhoto: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['planning', 'active', 'completed', 'cancelled'],
    default: 'planning'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  publicUrl: {
    type: String,
    unique: true,
    sparse: true
  },
  budget: {
    total: {
      type: Number,
      default: 5000, // Default budget of 5000
      min: [0, 'Budget cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    breakdown: {
      accommodation: {
        type: Number,
        default: 2000 // 40% of total
      },
      transportation: {
        type: Number,
        default: 1000 // 20% of total
      },
      activities: {
        type: Number,
        default: 1000 // 20% of total
      },
      food: {
        type: Number,
        default: 750 // 15% of total
      },
      other: {
        type: Number,
        default: 250 // 5% of total
      }
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
    },
    breakdown: {
      accommodation: { type: Number, default: 0 },
      transportation: { type: Number, default: 0 },
      activities: { type: Number, default: 0 },
      food: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    }
  },
  destinations: [{
    city: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true
    },
    arrivalDate: {
      type: Date,
      required: true
    },
    departureDate: {
      type: Date,
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  basket: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Activity'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowSharing: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Generate public URL
tripSchema.pre('save', function(next) {
  if (this.isPublic && !this.publicUrl) {
    this.publicUrl = `trip-${this._id}-${Date.now()}`;
  }
  next();
});

// Validate dates
tripSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    next(new Error('End date must be after start date'));
  }
  next();
});

// Index for better query performance
tripSchema.index({ user: 1, startDate: -1 });
tripSchema.index({ status: 1, startDate: 1 });

module.exports = mongoose.model('Trip', tripSchema); 