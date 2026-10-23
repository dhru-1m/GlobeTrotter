/**
 * Budget Engine — dynamic, destination-aware cost estimator.
 *
 * Instead of generating random numbers, this engine uses:
 *   • the trip's actual destinations (city + country)
 *   • the number of days at each destination
 *   • any activities already planned (with real costs)
 *   • a travel-style multiplier (budget / moderate / luxury)
 *
 * It produces a full breakdown that the frontend can visualise.
 */

// ──────────────────────────────────────────────────────────
//  Regional cost-of-living indices (daily, per person, USD)
// ──────────────────────────────────────────────────────────
const REGION_DAILY_COSTS = {
  // South-East Asia
  'Thailand':       { accommodation: 35, food: 15, transport: 10, activities: 12, other: 8  },
  'Vietnam':        { accommodation: 25, food: 10, transport: 8,  activities: 10, other: 6  },
  'Indonesia':      { accommodation: 30, food: 12, transport: 10, activities: 15, other: 8  },
  'Cambodia':       { accommodation: 22, food: 8,  transport: 6,  activities: 10, other: 5  },
  'Philippines':    { accommodation: 28, food: 10, transport: 8,  activities: 12, other: 6  },
  'Malaysia':       { accommodation: 35, food: 12, transport: 10, activities: 14, other: 8  },

  // South Asia
  'India':          { accommodation: 25, food: 10, transport: 8,  activities: 10, other: 6  },
  'Sri Lanka':      { accommodation: 28, food: 10, transport: 8,  activities: 12, other: 6  },
  'Nepal':          { accommodation: 20, food: 8,  transport: 6,  activities: 10, other: 5  },

  // East Asia
  'Japan':          { accommodation: 90, food: 35, transport: 25, activities: 25, other: 15 },
  'South Korea':    { accommodation: 65, food: 25, transport: 18, activities: 20, other: 12 },
  'China':          { accommodation: 45, food: 18, transport: 12, activities: 15, other: 10 },
  'Taiwan':         { accommodation: 50, food: 18, transport: 12, activities: 15, other: 10 },

  // Europe — Western
  'France':         { accommodation: 110, food: 45, transport: 20, activities: 25, other: 15 },
  'United Kingdom': { accommodation: 120, food: 45, transport: 25, activities: 25, other: 18 },
  'UK':             { accommodation: 120, food: 45, transport: 25, activities: 25, other: 18 },
  'Germany':        { accommodation: 85, food: 35, transport: 18, activities: 20, other: 14 },
  'Italy':          { accommodation: 90, food: 40, transport: 18, activities: 22, other: 14 },
  'Spain':          { accommodation: 75, food: 30, transport: 15, activities: 18, other: 12 },
  'Netherlands':    { accommodation: 100, food: 38, transport: 18, activities: 22, other: 15 },
  'Switzerland':    { accommodation: 160, food: 55, transport: 30, activities: 30, other: 20 },
  'Austria':        { accommodation: 85, food: 35, transport: 18, activities: 22, other: 14 },
  'Belgium':        { accommodation: 90, food: 35, transport: 18, activities: 20, other: 14 },
  'Portugal':       { accommodation: 65, food: 25, transport: 12, activities: 15, other: 10 },

  // Europe — Eastern
  'Czech Republic': { accommodation: 50, food: 18, transport: 10, activities: 12, other: 8  },
  'Poland':         { accommodation: 40, food: 15, transport: 8,  activities: 10, other: 7  },
  'Hungary':        { accommodation: 40, food: 15, transport: 8,  activities: 10, other: 7  },
  'Croatia':        { accommodation: 55, food: 22, transport: 12, activities: 14, other: 9  },
  'Greece':         { accommodation: 60, food: 25, transport: 12, activities: 15, other: 10 },
  'Turkey':         { accommodation: 40, food: 15, transport: 10, activities: 12, other: 8  },

  // Americas
  'United States':  { accommodation: 130, food: 45, transport: 25, activities: 30, other: 18 },
  'USA':            { accommodation: 130, food: 45, transport: 25, activities: 30, other: 18 },
  'Canada':         { accommodation: 110, food: 40, transport: 22, activities: 25, other: 15 },
  'Mexico':         { accommodation: 45, food: 15, transport: 10, activities: 12, other: 8  },
  'Brazil':         { accommodation: 45, food: 18, transport: 10, activities: 14, other: 8  },
  'Argentina':      { accommodation: 35, food: 15, transport: 8,  activities: 12, other: 7  },
  'Colombia':       { accommodation: 30, food: 12, transport: 8,  activities: 10, other: 6  },
  'Peru':           { accommodation: 30, food: 12, transport: 8,  activities: 10, other: 6  },
  'Costa Rica':     { accommodation: 55, food: 22, transport: 12, activities: 16, other: 10 },

  // Middle East
  'UAE':            { accommodation: 120, food: 40, transport: 22, activities: 30, other: 18 },
  'Saudi Arabia':   { accommodation: 90, food: 30, transport: 18, activities: 22, other: 14 },
  'Jordan':         { accommodation: 55, food: 18, transport: 12, activities: 15, other: 9  },
  'Israel':         { accommodation: 100, food: 40, transport: 22, activities: 25, other: 15 },

  // Africa
  'South Africa':   { accommodation: 45, food: 18, transport: 12, activities: 15, other: 8  },
  'Morocco':        { accommodation: 35, food: 12, transport: 8,  activities: 10, other: 6  },
  'Egypt':          { accommodation: 30, food: 10, transport: 8,  activities: 10, other: 6  },
  'Kenya':          { accommodation: 50, food: 18, transport: 12, activities: 20, other: 10 },
  'Tanzania':       { accommodation: 55, food: 18, transport: 14, activities: 25, other: 10 },

  // Oceania
  'Australia':      { accommodation: 110, food: 40, transport: 22, activities: 25, other: 18 },
  'New Zealand':    { accommodation: 95, food: 35, transport: 20, activities: 22, other: 15 },
  'Fiji':           { accommodation: 80, food: 30, transport: 15, activities: 20, other: 12 },
};

// Fallback for countries not in the list
const DEFAULT_DAILY = { accommodation: 70, food: 25, transport: 15, activities: 18, other: 10 };

// Travel-style multipliers
const STYLE_MULTIPLIER = {
  budget:   0.55,
  moderate: 1.0,
  luxury:   2.2,
};

// ──────────────────────────────────────────────────
//  City-level adjustments (relative to country avg)
// ──────────────────────────────────────────────────
const CITY_MULTIPLIER = {
  // Expensive cities
  'new york':      1.35, 'san francisco': 1.30, 'los angeles':  1.20,
  'london':        1.25, 'paris':         1.20, 'zurich':       1.30,
  'geneva':        1.30, 'tokyo':         1.15, 'osaka':        1.05,
  'sydney':        1.15, 'melbourne':     1.10,
  'dubai':         1.20, 'abu dhabi':     1.15,
  'hong kong':     1.25, 'singapore':     1.20,
  'mumbai':        1.25, 'delhi':         1.15, 'bangalore':    1.20,

  // Cheaper cities
  'chiang mai':    0.75, 'bali':          0.80, 'hanoi':        0.85,
  'cairo':         0.85, 'marrakech':     0.90,
  'lisbon':        0.95, 'budapest':      0.90, 'prague':       0.92,
  'krakow':        0.85,
};

// ──────────────────────────────────────────────────
//  Saving tips template by category
// ──────────────────────────────────────────────────
const SAVING_TIPS = {
  accommodation: [
    'Book hostels or guesthouses instead of hotels to save 40–60 %.',
    'Use Airbnb for longer stays — weekly discounts often apply.',
    'Consider house-sitting or Couchsurfing for free stays.',
    'Book accommodation with kitchen access to cut food costs too.',
  ],
  food: [
    'Eat at local street-food stalls — they are often cheaper AND tastier.',
    'Shop at supermarkets and cook breakfast to save on morning meals.',
    'Lunch specials at restaurants are usually 30–50 % cheaper than dinner.',
    'Carry a refillable water bottle to avoid buying bottled water.',
  ],
  transportation: [
    'Use public transport day-passes instead of individual tickets.',
    'Book flights mid-week and in advance for the best fares.',
    'Walk or cycle for short distances — free and healthy.',
    'Consider overnight buses or trains to save on a night of accommodation.',
  ],
  activities: [
    'Look for free walking tours (tip-based) in major cities.',
    'Many museums offer free entry on certain days or evenings.',
    'Purchase city tourist passes for bundled discounts.',
    'Explore nature trails, parks, and beaches — most are free.',
  ],
  other: [
    'Get a no-foreign-transaction-fee credit card before you travel.',
    'Buy a local SIM card instead of using expensive roaming plans.',
    'Travel during shoulder season for lower prices and fewer crowds.',
    'Set a daily spending limit and track expenses in real-time.',
  ],
};


// ─────────────────────────────
//  Main estimation function
// ─────────────────────────────
function estimateBudget(trip, activities = [], options = {}) {
  const { travelStyle = 'moderate', groupSize = 1 } = options;
  const styleMul = STYLE_MULTIPLIER[travelStyle] || STYLE_MULTIPLIER.moderate;

  const startDate = new Date(trip.startDate);
  const endDate   = new Date(trip.endDate);
  const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));

  // ── Build per-destination spending estimates ──
  const destinations = (trip.destinations && trip.destinations.length > 0)
    ? trip.destinations
    : [{ city: 'General', country: 'Unknown', arrivalDate: trip.startDate, departureDate: trip.endDate }];

  const destinationBreakdowns = destinations.map(dest => {
    const country = dest.country || 'Unknown';
    const city    = (dest.city || '').toLowerCase();

    // Look up regional costs
    const base = REGION_DAILY_COSTS[country] || DEFAULT_DAILY;
    const cityMul  = CITY_MULTIPLIER[city] || 1.0;

    // Days at this destination
    const arrival   = new Date(dest.arrivalDate || trip.startDate);
    const departure = new Date(dest.departureDate || trip.endDate);
    const days = Math.max(1, Math.ceil((departure - arrival) / (1000 * 60 * 60 * 24)));

    // Per-day after multipliers
    const dailyCosts = {
      accommodation:  Math.round(base.accommodation * cityMul * styleMul),
      food:           Math.round(base.food * cityMul * styleMul),
      transportation: Math.round(base.transport * cityMul * styleMul),
      activities:     Math.round(base.activities * cityMul * styleMul),
      other:          Math.round(base.other * cityMul * styleMul),
    };
    dailyCosts.dailyTotal = Object.values(dailyCosts).reduce((s, v) => s + v, 0);

    return {
      city: dest.city || 'General',
      country,
      days,
      arrivalDate: dest.arrivalDate,
      departureDate: dest.departureDate,
      dailyCosts,
      subtotal: dailyCosts.dailyTotal * days * groupSize,
    };
  });

  // ── Aggregate category totals ──
  const breakdown = { accommodation: 0, food: 0, transportation: 0, activities: 0, other: 0 };
  destinationBreakdowns.forEach(db => {
    Object.keys(breakdown).forEach(cat => {
      breakdown[cat] += db.dailyCosts[cat] * db.days * groupSize;
    });
  });

  // ── Factor in real activity costs ──
  let actualActivitySpend = 0;
  const activityCostsByDate = {};
  activities.forEach(act => {
    const cost = act.cost?.amount || 0;
    actualActivitySpend += cost;
    const dateKey = act.date ? new Date(act.date).toISOString().split('T')[0] : null;
    if (dateKey) {
      if (!activityCostsByDate[dateKey]) activityCostsByDate[dateKey] = 0;
      activityCostsByDate[dateKey] += cost;
    }
  });

  // If real activity costs exceed the estimate, use them
  if (actualActivitySpend > breakdown.activities) {
    breakdown.activities = actualActivitySpend;
  }

  const estimatedTotal = Object.values(breakdown).reduce((s, v) => s + v, 0);

  // ── Build daily breakdown ──
  const dailyBreakdown = {};
  let cursor = new Date(startDate);
  for (let i = 0; i < totalDays; i++) {
    const dateKey = cursor.toISOString().split('T')[0];

    // Find which destination this date belongs to
    const matchedDest = destinationBreakdowns.find(db => {
      const arr = new Date(db.arrivalDate || trip.startDate);
      const dep = new Date(db.departureDate || trip.endDate);
      return cursor >= arr && cursor < dep;
    }) || destinationBreakdowns[destinationBreakdowns.length - 1];

    const dc = matchedDest.dailyCosts;
    const realActCost = activityCostsByDate[dateKey] || 0;

    dailyBreakdown[dateKey] = {
      accommodation:  dc.accommodation * groupSize,
      food:           dc.food * groupSize,
      transportation: dc.transportation * groupSize,
      activities:     Math.max(dc.activities * groupSize, realActCost),
      other:          dc.other * groupSize,
      destination:    matchedDest.city,
    };
    dailyBreakdown[dateKey].total = Object.entries(dailyBreakdown[dateKey])
      .filter(([k]) => k !== 'destination')
      .reduce((s, [, v]) => s + v, 0);

    cursor.setDate(cursor.getDate() + 1);
  }

  // ── Generate dynamic suggestions ──
  const suggestions = buildSuggestions(breakdown, estimatedTotal, trip, travelStyle, totalDays, groupSize);

  // ── Pick relevant saving tips ──
  const topCategory = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0][0];
  const tips = [
    ...(SAVING_TIPS[topCategory] || []).slice(0, 2),
    ...(SAVING_TIPS['food'] || []).slice(0, 1),
    ...(SAVING_TIPS['transportation'] || []).slice(0, 1),
  ];

  return {
    tripId: trip._id,
    tripName: trip.name,
    currency: trip.budget?.currency || 'USD',
    total: estimatedTotal,
    breakdown,
    dailyBreakdown,
    tripDays: totalDays,
    groupSize,
    travelStyle,
    destinationBreakdowns,
    suggestions,
    savingTips: tips,
    activities: activities.length,
    actualActivitySpend,
    averageDaily: Math.round(estimatedTotal / totalDays),
    isEstimate: true,
  };
}


// ──────────────────────────────────────
//  Dynamic spending suggestions
// ──────────────────────────────────────
function buildSuggestions(breakdown, total, trip, style, days, groupSize) {
  const suggestions = [];
  const pct = (cat) => total > 0 ? Math.round((breakdown[cat] / total) * 100) : 0;

  // Accommodation — typically 30-45 %
  const accPct = pct('accommodation');
  if (accPct > 45) {
    suggestions.push({
      category: 'accommodation',
      type: 'warning',
      title: 'Accommodation costs are high',
      message: `At ${accPct}% of your budget, accommodation is above the typical 30-45% range. Consider mixing in hostels or Airbnbs to bring costs down.`,
      potentialSaving: Math.round(breakdown.accommodation * 0.2),
    });
  } else if (accPct < 20) {
    suggestions.push({
      category: 'accommodation',
      type: 'info',
      title: 'Low accommodation allocation',
      message: `Only ${accPct}% goes to accommodation. Make sure this covers a safe, comfortable stay.`,
    });
  }

  // Food — typically 15-25 %
  const foodPct = pct('food');
  if (foodPct > 30) {
    suggestions.push({
      category: 'food',
      type: 'warning',
      title: 'High food spending',
      message: `Food takes up ${foodPct}% of the budget. Try local street food and cooking when possible.`,
      potentialSaving: Math.round(breakdown.food * 0.25),
    });
  }

  // Transport — typically 10-20 %
  const transPct = pct('transportation');
  if (transPct > 25) {
    suggestions.push({
      category: 'transportation',
      type: 'tip',
      title: 'Transport costs are steep',
      message: `${transPct}% on transport — public transit passes and walking can save a lot.`,
      potentialSaving: Math.round(breakdown.transportation * 0.3),
    });
  }

  // General per-day check against user-set budget
  const userBudget = trip.budget?.total || 0;
  if (userBudget > 0 && total > userBudget) {
    const over = total - userBudget;
    suggestions.push({
      category: 'overall',
      type: 'danger',
      title: 'Estimated cost exceeds your budget',
      message: `The estimated total is $${total.toLocaleString()} but your budget is $${userBudget.toLocaleString()} — you are $${over.toLocaleString()} over. Consider switching to a more budget-friendly travel style or reducing days.`,
      potentialSaving: over,
    });
  } else if (userBudget > 0 && total < userBudget * 0.6) {
    suggestions.push({
      category: 'overall',
      type: 'success',
      title: 'You are well within budget',
      message: `Estimated total is only ${Math.round((total / userBudget) * 100)}% of your budget. You have room to upgrade accommodation or add more activities.`,
    });
  }

  // Multi-destination inter-city transport hint
  const dests = trip.destinations || [];
  if (dests.length > 1) {
    suggestions.push({
      category: 'transportation',
      type: 'info',
      title: `${dests.length} destinations — plan inter-city travel`,
      message: `You have ${dests.length} destinations. Book connecting flights/trains early for cheaper fares. Budget roughly $50–200 per connection depending on distance.`,
    });
  }

  // Group size hint
  if (groupSize > 1) {
    suggestions.push({
      category: 'overall',
      type: 'tip',
      title: 'Group savings potential',
      message: `With ${groupSize} people, sharing accommodation and transport can cut per-person costs by 20–40 %.`,
      potentialSaving: Math.round(total * 0.15),
    });
  }

  return suggestions;
}


module.exports = { estimateBudget, REGION_DAILY_COSTS, STYLE_MULTIPLIER, CITY_MULTIPLIER };
