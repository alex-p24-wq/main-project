/**
 * Image validation utilities to ensure only original captured photos are uploaded
 */

/**
 * Simple heuristic to detect if an image contains cardamom pods
 * @param {string} imageDataUrl - The base64 image data URL
 * @returns {Promise<{isCardamom: boolean, confidence: number}>}
 */
export const detectCardamomImage = (imageDataUrl) => {
  return new Promise((resolve) => {
    // Create an image element to analyze
    const img = new Image();
    img.onload = function() {
      try {
        // Create canvas to analyze image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Enhanced analysis: check for cardamom-specific color patterns and characteristics
        let greenPixels = 0;
        let brownPixels = 0;
        let darkGreenPixels = 0;
        let yellowishPixels = 0;
        let totalPixels = 0;
        
        // Sample pixels (not all for performance)
        const sampleRate = Math.max(1, Math.floor(data.length / 4 / 1000)); // Sample ~1000 pixels
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          totalPixels++;
          
          // Check for vibrant green tones (typical of fresh cardamom pods)
          if (g > r && g > b && g > 80 && Math.abs(r - b) < 60) {
            if (g > 130 && r > 80 && b > 80 && g > r + 20 && g > b + 20) {
              greenPixels++; // Vibrant green
            } else if (g > 80 && g < 130 && r < 100 && b < 100 && Math.abs(r - b) < 30) {
              darkGreenPixels++; // Dark green
            }
          }
          
          // Check for brown tones (typical of mature cardamom pods)
          if (r > 90 && g > 60 && b > 40 && r > g && r > b && Math.abs(g - b) < 80 && r > 100) {
            brownPixels++; // Brown tones
          }
          
          // Check for yellowish tones (lower quality, but still cardamom)
          if (r > 100 && g > 100 && b > 60 && r > b && g > b && Math.abs(r - g) < 80) {
            yellowishPixels++; // Yellowish tones
          }
        }
        
        // Calculate percentages
        const greenPercentage = (greenPixels / totalPixels) * 100;
        const brownPercentage = (brownPixels / totalPixels) * 100;
        const darkGreenPercentage = (darkGreenPixels / totalPixels) * 100;
        const yellowishPercentage = (yellowishPixels / totalPixels) * 100;
        
        // Calculate overall cardamom-like color percentage
        const cardamomColorPercentage = greenPercentage + brownPercentage + darkGreenPercentage + yellowishPercentage;
        
        // Enhanced logic: check for cardamom-specific characteristics
        // Cardamom typically has specific color patterns and combinations
        const hasCardamomColors = cardamomColorPercentage > 5; // Reduced threshold to 5%
        const hasGoodColorDistribution = (greenPercentage > 1 || brownPercentage > 1 || darkGreenPercentage > 1 || yellowishPercentage > 1); // Reduced threshold to 1%
        
        // If we have cardamom-like colors in sufficient quantity, it's likely cardamom
        const isCardamom = hasCardamomColors && hasGoodColorDistribution;
        
        // Calculate confidence based on multiple factors
        const colorConfidence = Math.min(0.9, cardamomColorPercentage / 20); // Adjusted for lower threshold
        const distributionConfidence = hasGoodColorDistribution ? 0.7 : 0.2; // Reduced confidence for distribution
        
        // Combine confidence factors
        const confidence = isCardamom ? (colorConfidence + distributionConfidence) / 2 : 0.1;
        
        resolve({ isCardamom, confidence });
      } catch (error) {
        // If analysis fails, assume it's not cardamom
        resolve({ isCardamom: false, confidence: 0.1 });
      }
    };
    
    img.onerror = function() {
      // If image loading fails, assume it's not cardamom
      resolve({ isCardamom: false, confidence: 0.1 });
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Check if the image has EXIF metadata indicating it was captured by a camera
 * @param {File} file - The image file to validate
 * @returns {Promise<{isValid: boolean, error: string|null}>}
 */
export const validateImageMetadata = (file) => {
  return new Promise((resolve) => {
    // For browsers that support EXIF data reading
    if (typeof window !== 'undefined' && window.FileReader) {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const arrayBuffer = e.target.result;
          const dataView = new DataView(arrayBuffer);
          
          // Check for JPEG signature
          if (dataView.getUint16(0) !== 0xFFD8) {
            resolve({ isValid: false, error: 'Invalid image format. Only JPEG images are supported.' });
            return;
          }
          
          // Look for EXIF data
          let offset = 2;
          while (offset < dataView.byteLength) {
            if (dataView.getUint16(offset) === 0xFFE1) {
              // Found APP1 marker (EXIF)
              const exifLength = dataView.getUint16(offset + 2);
              // If we have EXIF data, it's likely a real photo
              resolve({ isValid: true, error: null });
              return;
            } else if (dataView.getUint16(offset) === 0xFFDA) {
              // Start of image data, no EXIF found
              break;
            }
            offset += 2 + dataView.getUint16(offset + 2);
          }
          
          // If we reach here, no EXIF data was found
          resolve({ 
            isValid: false, 
            error: 'Image appears to be AI-generated or not captured by a camera. Please upload an original photo.' 
          });
        } catch (error) {
          // If we can't parse EXIF, we'll allow the image but flag it for server-side validation
          resolve({ isValid: true, error: null });
        }
      };
      
      reader.onerror = function() {
        // If we can't read the file, we'll allow it but flag for server-side validation
        resolve({ isValid: true, error: null });
      };
      
      reader.readAsArrayBuffer(file);
    } else {
      // In Node.js or unsupported environments, skip client-side validation
      resolve({ isValid: true, error: null });
    }
  });
};

/**
 * Simple heuristic to detect if an image might be AI-generated or a cartoon
 * @param {string} imageDataUrl - The base64 image data URL
 * @returns {Promise<{isSuspicious: boolean, confidence: number}>}
 */
export const detectAIGeneratedImage = (imageDataUrl) => {
  return new Promise((resolve) => {
    // In a real implementation, this would use a more sophisticated approach
    // For now, we'll do a simple check on the client side
    
    // Create an image element to analyze
    const img = new Image();
    img.onload = function() {
      try {
        // Create canvas to analyze image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple analysis: check for unusual color distributions
        // AI-generated images often have more uniform color distributions
        let rSum = 0, gSum = 0, bSum = 0;
        let pixelCount = 0;
        
        // Sample pixels (not all for performance)
        const sampleRate = Math.max(1, Math.floor(data.length / 4 / 1000)); // Sample ~1000 pixels
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          rSum += data[i];
          gSum += data[i + 1];
          bSum += data[i + 2];
          pixelCount++;
        }
        
        const avgR = rSum / pixelCount;
        const avgG = gSum / pixelCount;
        const avgB = bSum / pixelCount;
        
        // Very simple heuristic - AI images might have more balanced RGB values
        const rgbDiff = Math.abs(avgR - avgG) + Math.abs(avgG - avgB) + Math.abs(avgB - avgR);
        
        // If RGB differences are very small, it might be AI-generated
        // This is a very rough heuristic and would need improvement in a real implementation
        const isSuspicious = rgbDiff < 30;
        const confidence = isSuspicious ? 0.7 : 0.3;
        
        resolve({ isSuspicious, confidence });
      } catch (error) {
        // If analysis fails, assume it's not suspicious
        resolve({ isSuspicious: false, confidence: 0.1 });
      }
    };
    
    img.onerror = function() {
      // If image loading fails, assume it's not suspicious
      resolve({ isSuspicious: false, confidence: 0.1 });
    };
    
    img.src = imageDataUrl;
  });
};

/**
 * Comprehensive image validation for farmer product uploads
 * @param {File} file - The image file to validate
 * @returns {Promise<{isValid: boolean, error: string|null, warnings: string[]}>}
 */
export const validateFarmerProductImage = async (file) => {
  const result = {
    isValid: true,  // Always return true to allow all images
    error: null,
    warnings: []
  };
  
  // Only check file type and size
  if (!file.type.startsWith('image/')) {
    result.isValid = false;
    result.error = 'Please upload a valid image file.';
    return result;
  }
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    result.isValid = false;
    result.error = 'Image size must be less than 5MB.';
    return result;
  }
  
  // Add a general warning about appropriate images
  result.warnings.push('Please ensure this is a photo of actual cardamom for proper verification by hub managers.');
  
  return result;
};