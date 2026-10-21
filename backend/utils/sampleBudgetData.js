const generateSampleBudgetData = (startDate, endDate) => {
  // Helper to generate random number between min and max
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Generate daily values for each category
  const generateDailyData = (baseAmount, variance) => {
    return random(baseAmount - variance, baseAmount + variance);
  };

  // Calculate number of days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Sample base amounts for each category
  const baseAmounts = {
    accommodation: 150,
    transportation: 50,
    activities: 100,
    food: 80,
    other: 30
  };

  // Generate daily breakdown
  const dailyBreakdown = {};
  let currentDate = new Date(start);

  for (let i = 0; i < days; i++) {
    const dateKey = currentDate.toISOString().split('T')[0];
    dailyBreakdown[dateKey] = {
      accommodation: generateDailyData(baseAmounts.accommodation, 50),
      transportation: generateDailyData(baseAmounts.transportation, 30),
      activities: generateDailyData(baseAmounts.activities, 70),
      food: generateDailyData(baseAmounts.food, 40),
      other: generateDailyData(baseAmounts.other, 20)
    };
    dailyBreakdown[dateKey].total = Object.values(dailyBreakdown[dateKey]).reduce((a, b) => a + b, 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Calculate category totals
  const breakdown = Object.keys(baseAmounts).reduce((acc, category) => {
    acc[category] = Object.values(dailyBreakdown).reduce((sum, day) => sum + day[category], 0);
    return acc;
  }, {});

  // Calculate total
  const total = Object.values(breakdown).reduce((sum, amount) => sum + amount, 0);

  return {
    total,
    breakdown,
    dailyBreakdown,
    tripDays: days
  };
};

module.exports = generateSampleBudgetData;
