export const analyzeImageHeuristic = async (fileOrUrl) => {
  const img = new Image();
  const src = typeof fileOrUrl === "string" ? fileOrUrl : URL.createObjectURL(fileOrUrl);
  img.crossOrigin = "anonymous";

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });

  const maxSide = 256; 
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.floor(img.width * scale));
  const h = Math.max(1, Math.floor(img.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  let cardamomPixelCount = 0;
  let totalPixels = 0;
  let greenPixels = 0;
  let brownPixels = 0;
  let yellowishPixels = 0;
  let darkGreenPixels = 0;
  let brightnessSum = 0;
  let varianceSum = 0; 
  let contrastSum = 0; 

  const sampleRate = Math.max(1, Math.floor(data.length / 4 / 4000)); 
  const colorValues = [];

  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;
    brightnessSum += brightness;
    colorValues.push([r, g, b]);
    totalPixels++;

    // STRICT CARDAMOM DETECTION
    // Cardamom has a very specific muted/desaturated green or yellow hue. 
    // Pure vibrant greens (like green peas or fresh leaves) MUST be filtered out.

    const isGreenCardamom = 
      g >= r && g > b && 
      (g - b) > 15 && (g - b) < 100 && // Slightly wider blue allowance
      (g - r) >= 0 && (g - r) < 80 &&  // Cover the gap! Anything from g=r to g=r+80
      g > 30 && g < 240; // Expand brightness scope for flash photography lighting
    
    // Yellowish/Mature Cardamom
    const isYellowCardamom = 
      r > g && (r - g) < 55 && 
      (g - b) > 15 && 
      g > 30 && r < 240;

    // Filter out highly saturated/neon greens (like green peas, toys, grass)
    // In HSL, Cardamom is a low-saturation pale green/yellow.
    let maxColor = Math.max(r, g, b);
    let minColor = Math.min(r, g, b);
    let saturationRaw = (maxColor === 0) ? 0 : (maxColor - minColor) / maxColor;
    
    const isTooVibrant = saturationRaw > 0.65 && g > 150 && r < 100; // Neon/vibrant green check

    if ((isGreenCardamom || isYellowCardamom) && !isTooVibrant) {
      cardamomPixelCount++;
    }

    // Quality mapping for grading (only applied if it passes the cardamom check overall)
    // Premium Green: Strong green dominance over red, very low blue.
    if (g > r + 10 && g > b + 30 && g > 60) {
      greenPixels++;
      if (g < 140 && r < 100) {
        darkGreenPixels++;
      }
    } 
    // Brown/Lower Quality: Red is significantly higher than green.
    else if (r > g + 30 && r > b + 30 && r > 80) {
      brownPixels++;
    }
    // Yellowish: High red and green, low blue.
    else if (r > 100 && g > 100 && b < 80 && Math.abs(r - g) < 30) {
      yellowishPixels++;
    }

    // High brightness/washed out indicates poor quality or bad lighting
    if (brightness > 220 || brightness < 20) {
      yellowishPixels++;
    }
  }

  if (colorValues.length > 1) {
    let rSum = 0, gSum = 0, bSum = 0;
    for (const [r, g, b] of colorValues) {
      rSum += r; gSum += g; bSum += b;
    }
    const rMean = rSum / colorValues.length;
    const gMean = gSum / colorValues.length;
    const bMean = bSum / colorValues.length;

    let rVar = 0, gVar = 0, bVar = 0;
    for (const [r, g, b] of colorValues) {
      rVar += Math.pow(r - rMean, 2);
      gVar += Math.pow(g - gMean, 2);
      bVar += Math.pow(b - bMean, 2);
    }
    const avgVariance = (rVar + gVar + bVar) / colorValues.length;
    varianceSum = avgVariance;
  } else {
    varianceSum = 255 * 255; 
  }

  const greenPercentage = (greenPixels / totalPixels) * 100;
  const brownPercentage = (brownPixels / totalPixels) * 100;
  const darkGreenPercentage = (darkGreenPixels / totalPixels) * 100;
  const yellowishPercentage = (yellowishPixels / totalPixels) * 100;
  const avgBrightness = brightnessSum / totalPixels;

  let saturationSum = 0;
  let saturationCount = 0;
  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (max !== 0) {
      saturationSum += delta / max;
      saturationCount++;
    }
  }
  const avgSaturation = saturationCount > 0 ? saturationSum / saturationCount : 0;

  let maxBrightness = 0;
  let minBrightness = 255;
  for (let i = 0; i < data.length; i += 4 * sampleRate) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / 3;
    maxBrightness = Math.max(maxBrightness, brightness);
    minBrightness = Math.min(minBrightness, brightness);
  }
  const contrast = maxBrightness - minBrightness;

  let qualityScore = 0;
  let colorScore = 0;

  if (greenPercentage > 0.3 || darkGreenPercentage > 0.2) { 
    colorScore += Math.min(greenPercentage * 2.0, 50); 
    colorScore += Math.min(darkGreenPercentage * 1.5, 40); 
  }
  if (brownPercentage > 0.2) { 
    colorScore += Math.min(brownPercentage * 0.5, 15); 
  }
  colorScore -= Math.min(yellowishPercentage * 0.6, 30); 
  colorScore = Math.max(15, Math.min(100, colorScore)); 

  let brightnessScore = 0;
  if (avgBrightness >= 50 && avgBrightness <= 200) { 
    brightnessScore = 100 - Math.abs(avgBrightness - 125) * 0.4; 
  } else {
    brightnessScore = Math.max(10, 25 - Math.abs(avgBrightness - 125) * 0.05); 
  }

  let saturationScore = Math.min(avgSaturation * 120, 100); 

  const normalizedVariance = Math.min(100, varianceSum / 300); 
  let consistencyScore = Math.max(15, 100 - normalizedVariance); 
  let contrastScore = Math.min(contrast * 0.4, 100); 

  qualityScore = (
    (colorScore / 100) * 0.50 +
    (brightnessScore / 100) * 0.16 +
    (saturationScore / 100) * 0.16 +
    (consistencyScore / 100) * 0.12 +
    (contrastScore / 100) * 0.06
  );

  qualityScore = Math.min(1.0, qualityScore * 1.20); 

  let quality = "Regular";
  if (qualityScore >= 0.70) { 
    quality = "Premium";
  } else if (qualityScore >= 0.50) { 
    quality = "Special";
  }

  const cardamomPercentage = (cardamomPixelCount / totalPixels) * 100;
  
  // Stricter checking: if cardamom score is too low, reject immediately
  // We allow as low as 12% to account for packed cardamom in large plastic bags or images with large labels/backgrounds.
  if (cardamomPercentage < 12 || avgSaturation > 0.75) {
    return { 
      quality: "Not Cardamom", 
      qualityScore: 0, 
      isCardamom: false, 
      featureAnalysis: { 
        cardamomPercentage: parseFloat(cardamomPercentage.toFixed(2)),
        avgSaturation: parseFloat(avgSaturation.toFixed(2)) 
      } 
    };
  }

  return { 
    quality, 
    qualityScore, 
    isCardamom: true,
    featureAnalysis: {
      greenPercentage: parseFloat(greenPercentage.toFixed(2)),
      brownPercentage: parseFloat(brownPercentage.toFixed(2)),
      darkGreenPercentage: parseFloat(darkGreenPercentage.toFixed(2)),
      yellowishPercentage: parseFloat(yellowishPercentage.toFixed(2)),
      avgBrightness: parseFloat(avgBrightness.toFixed(2)),
      avgSaturation: parseFloat(avgSaturation.toFixed(2)),
      consistency: parseFloat(((100 - normalizedVariance) / 100).toFixed(2)),
      contrastLevel: parseFloat((contrast / 255).toFixed(2)),
      cardamomPercentage: parseFloat(cardamomPercentage.toFixed(2))
    }
  };
};

export const calculateImagePrice = (imageGradeObj, marketData) => {
  if (!marketData) return 0;
  
  if (imageGradeObj && imageGradeObj.isCardamom === false) {
    return 0;
  }

  const maxPrice = parseInt(marketData.max_price || 0);
  const avgPrice = parseInt(marketData.avg_price || 0);
  const qualityScore = imageGradeObj.qualityScore || 0;
  const priceRange = maxPrice - avgPrice;
  let calculatedPrice = 0;

  if (qualityScore >= 0.85) {
    const position = 0.9 + 0.1 * ((qualityScore - 0.85) / 0.15);
    calculatedPrice = Math.round(avgPrice + priceRange * position);
  } else if (qualityScore >= 0.70) {
    const position = 0.6 + 0.3 * ((qualityScore - 0.70) / 0.15);
    calculatedPrice = Math.round(avgPrice + priceRange * position);
  } else if (qualityScore >= 0.50) {
    const position = 0.2 + 0.4 * ((qualityScore - 0.50) / 0.20);
    calculatedPrice = Math.round(avgPrice + priceRange * position);
  } else {
    calculatedPrice = Math.round(avgPrice * (0.5 + 0.5 * qualityScore));
  }

  if (qualityScore >= 0.85) {
    calculatedPrice = Math.max(calculatedPrice, Math.min(maxPrice, maxPrice * 0.95));
  } else if (qualityScore >= 0.70 && qualityScore < 0.85) {
    calculatedPrice = Math.max(calculatedPrice, avgPrice * 1.15);
  } else if (qualityScore >= 0.50 && qualityScore < 0.70) {
    calculatedPrice = Math.max(calculatedPrice, avgPrice * 0.9);
  }

  return calculatedPrice;
};
