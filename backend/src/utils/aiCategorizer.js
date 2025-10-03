const categoryKeywords = {
  road: [
    'pothole', 'road', 'street', 'highway', 'traffic', 'pavement',
    'crack', 'asphalt', 'intersection', 'signal', 'sign', 'lane'
  ],
  water: [
    'water', 'leak', 'pipe', 'drain', 'sewage', 'flood', 'plumbing',
    'tap', 'supply', 'drainage', 'overflow', 'burst'
  ],
  electricity: [
    'electric', 'power', 'light', 'wire', 'cable', 'pole', 'outage',
    'blackout', 'transformer', 'streetlight', 'lamp', 'voltage'
  ],
  waste: [
    'garbage', 'trash', 'waste', 'litter', 'dump', 'rubbish', 'bin',
    'landfill', 'disposal', 'sanitation', 'smell', 'dirty'
  ],
  safety: [
    'danger', 'unsafe', 'hazard', 'risk', 'broken', 'damaged', 'accident',
    'injury', 'security', 'crime', 'violence', 'threat', 'emergency'
  ]
};

/**
 * Categorize text based on keyword matching
 * @param {string} text - Description text to categorize
 * @returns {string} - Suggested category
 */
exports.categorize = (text) => {
  if (!text || typeof text !== 'string') {
    return 'other';
  }

  const lowerText = text.toLowerCase();
  const scores = {};

  // Calculate scores for each category
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      // Count occurrences of each keyword
      const regex = new RegExp(keyword, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        scores[category] += matches.length;
      }
    }
  }

  // Find category with highest score
  let maxScore = 0;
  let suggestedCategory = 'other';

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      suggestedCategory = category;
    }
  }

  // Return 'other' if no strong match (score < 1)
  return maxScore >= 1 ? suggestedCategory : 'other';
};