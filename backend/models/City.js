const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'City name is required'],
    trim: true
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  countryCode: {
    type: String,
    required: true,
    uppercase: true,
    minlength: 2,
    maxlength: 3
  },
  region: {
    type: String,
    trim: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  timezone: {
    type: String,
    required: true
  },
  population: {
    type: Number,
    min: 0
  },
  costIndex: {
    type: Number,
    min: 0,
    max: 200,
    default: 100 // Base index of 100
  },
  currency: {
    type: String,
    required: true,
    enum: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RUB', 'TRY', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'PYG', 'BOB', 'GTQ', 'HNL', 'NIO', 'CRC', 'PAB', 'VES', 'DOP', 'JMD', 'TTD', 'BBD', 'XCD', 'ANG', 'AWG', 'SRD', 'GYD', 'BZD', 'BMD', 'KYD', 'FKP', 'GIP', 'SHP', 'AOA', 'BWP', 'LSL', 'NAD', 'SZL', 'ZAR', 'ZMW', 'MWK', 'ZWL', 'EGP', 'LYD', 'TND', 'DZD', 'MAD', 'MRO', 'MRU', 'XOF', 'XAF', 'XPF', 'CDF', 'GMD', 'GHS', 'NGN', 'SLL', 'SOS', 'TZS', 'UGX', 'KES', 'ETB', 'DJF', 'KMF', 'MUR', 'SCR', 'SYP', 'LBP', 'JOD', 'IQD', 'KWD', 'BHD', 'OMR', 'QAR', 'AED', 'SAR', 'YER', 'IRR', 'AFN', 'PKR', 'INR', 'BDT', 'LKR', 'NPR', 'BTN', 'MMK', 'THB', 'LAK', 'KHR', 'VND', 'IDR', 'MYR', 'SGD', 'BND', 'PHP', 'TWD', 'HKD', 'CNY', 'KRW', 'JPY', 'MNT', 'KZT', 'UZS', 'TJS', 'TMT', 'AZN', 'GEL', 'AMD', 'BYN', 'MDL', 'UAH', 'RUB', 'KGS', 'TMM', 'TMT', 'MVR', 'NZD', 'FJD', 'VUV', 'WST', 'TOP', 'TVD', 'KID', 'XPF', 'NIO', 'CRC', 'PAB', 'VES', 'DOP', 'JMD', 'TTD', 'BBD', 'XCD', 'ANG', 'AWG', 'SRD', 'GYD', 'BZD', 'BMD', 'KYD', 'FKP', 'GIP', 'SHP', 'AOA', 'BWP', 'LSL', 'NAD', 'SZL', 'ZAR', 'ZMW', 'MWK', 'ZWL', 'EGP', 'LYD', 'TND', 'DZD', 'MAD', 'MRO', 'MRU', 'XOF', 'XAF', 'XPF', 'CDF', 'GMD', 'GHS', 'NGN', 'SLL', 'SOS', 'TZS', 'UGX', 'KES', 'ETB', 'DJF', 'KMF', 'MUR', 'SCR', 'SYP', 'LBP', 'JOD', 'IQD', 'KWD', 'BHD', 'OMR', 'QAR', 'AED', 'SAR', 'YER', 'IRR', 'AFN', 'PKR', 'INR', 'BDT', 'LKR', 'NPR', 'BTN', 'MMK', 'THB', 'LAK', 'KHR', 'VND', 'IDR', 'MYR', 'SGD', 'BND', 'PHP', 'TWD', 'HKD', 'CNY', 'KRW', 'JPY', 'MNT', 'KZT', 'UZS', 'TJS', 'TMT', 'AZN', 'GEL', 'AMD', 'BYN', 'MDL', 'UAH', 'RUB', 'KGS', 'TMM', 'TMT', 'MVR', 'NZD', 'FJD', 'VUV', 'WST', 'TOP', 'TVD', 'KID', 'XPF']
  },
  languages: [{
    type: String,
    trim: true
  }],
  climate: {
    type: {
      type: String,
      enum: ['tropical', 'dry', 'temperate', 'continental', 'polar'],
      required: true
    },
    averageTemp: {
      summer: Number,
      winter: Number
    },
    rainfall: {
      type: String,
      enum: ['low', 'moderate', 'high']
    }
  },
  attractions: [{
    name: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['landmark', 'museum', 'park', 'beach', 'mountain', 'shopping', 'entertainment', 'cultural', 'historical', 'natural'],
      required: true
    },
    description: String,
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    cost: {
      type: Number,
      min: 0
    },
    costCurrency: {
      type: String,
      trim: true
    },
    bestTimeToVisit: {
      type: String,
      trim: true
    },
    visitDuration: {
      type: String,
      trim: true
    },
    highlights: [{ type: String, trim: true }]
  }],
  transportation: {
    airport: {
      hasInternational: {
        type: Boolean,
        default: false
      },
      name: String,
      code: String
    },
    publicTransport: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'fair'
    },
    metro: {
      type: Boolean,
      default: false
    },
    bus: {
      type: Boolean,
      default: true
    },
    taxi: {
      type: Boolean,
      default: true
    }
  },
  safety: {
    rating: {
      type: Number,
      min: 1,
      max: 10,
      default: 5
    },
    notes: String
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  popularity: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient city search
citySchema.index({ name: 1, country: 1 }, { unique: true });
citySchema.index({ country: 1, name: 1 });
citySchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
citySchema.index({ costIndex: 1, popularity: 1 });
citySchema.index({ tags: 1 });

// Text search index
citySchema.index({ name: 'text', country: 'text', region: 'text' });

module.exports = mongoose.model('City', citySchema); 