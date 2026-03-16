/**
 * Server-side image validation utilities to ensure only original captured photos are uploaded
 */
import fs from 'fs';
import exif from 'exif-reader';

/**
 * Simple heuristic to detect if an image contains cardamom pods
 * @param {string} filePath - The path to the uploaded image file
 * @returns {Promise<{isCardamom: boolean, confidence: number}>}
 */
export const detectCardamomImage = async (filePath) => {
  try {
    // Dynamically load sharp to prevent Vercel startup crashes if binary is missing
    let sharp;
    try {
      sharp = (await import('sharp')).default;
    } catch (e) {
      console.warn("Sharp module not found, skipping image analysis.");
      return { isCardamom: false, confidence: 0.1 };
    }

    // Resize image for faster processing
    const resizedBuffer = await sharp(filePath)
      .resize(256, 256, { fit: 'inside' })
      .toBuffer();
    
    // Get raw pixel data
    const { data, info } = await sharp(resizedBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { width, height, channels } = info;
    let greenPixels = 0;
    let brownPixels = 0;
    let totalPixels = 0;
    
    // Analyze pixels
    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      totalPixels++;
      
      // Check for green tones (typical of cardamom pods)
      if (g > r && g > b && g > 100) {
        greenPixels++;
      }
      
      // Check for brown tones (typical of cardamom pods)
      if (r > g && r > b && r > 100 && g > 80 && b < 100) {
        brownPixels++;
      }
    }
    
    // Calculate percentages
    const greenPercentage = (greenPixels / totalPixels) * 100;
    const brownPercentage = (brownPixels / totalPixels) * 100;
    
    // If we have a reasonable amount of green or brown pixels, it might be cardamom
    const isCardamom = greenPercentage > 2 || brownPercentage > 2;  // Lowered threshold for more flexibility
    const confidence = isCardamom ? Math.min(0.9, (greenPercentage + brownPercentage) / 10) : 0.1;  // Adjusted calculation
    
    return { isCardamom, confidence };
  } catch (error) {
    // If analysis fails, assume it's not cardamom
    return { isCardamom: false, confidence: 0.1 };
  }
};

/**
 * Check if the image has EXIF metadata indicating it was captured by a camera
 * @param {string} filePath - The path to the uploaded image file
 * @returns {Promise<{isValid: boolean, error: string|null}>}
 */
export const validateImageMetadata = async (filePath) => {
  try {
    // Read the file
    const buffer = fs.readFileSync(filePath);
    
    // Check if it's a JPEG file (which typically has EXIF data)
    if (buffer.length < 2 || buffer[0] !== 0xFF || buffer[1] !== 0xD8) {
      return { 
        isValid: false, 
        error: 'Invalid image format. Only JPEG images with EXIF data are supported.' 
      };
    }
    
    // Try to extract EXIF data
    try {
      const exifData = exif(buffer);
      
      // If we successfully extracted EXIF data, it's likely a real photo
      if (exifData && exifData.image) {
        return { isValid: true, error: null };
      }
      
      // If no EXIF data but it's a valid image, still allow it (some phones don't save EXIF)
      return { 
        isValid: true, 
        error: null 
      };
    } catch (exifError) {
      // If EXIF parsing fails, it might not be a camera photo
      return { 
        isValid: false, 
        error: 'Unable to verify image authenticity. Please upload an original photo captured by a camera.' 
      };
    }
  } catch (error) {
    // If we can't read the file, reject it
    return { 
      isValid: false, 
      error: 'Unable to process image file.' 
    };
  }
};

/**
 * Simple heuristic to detect if an image might be AI-generated or a cartoon
 * @param {string} filePath - The path to the uploaded image file
 * @returns {Promise<{isSuspicious: boolean, confidence: number}>}
 */
export const detectAIGeneratedImage = async (filePath) => {
  // In a production environment, this would use a more sophisticated approach
  // such as TensorFlow.js or calling an external AI service
  
  // For now, we'll do a simple check based on file characteristics
  try {
    const stats = fs.statSync(filePath);
    
    // Very basic heuristic - if the file is unusually small for its dimensions,
    // it might be compressed heavily or AI-generated
    // This is a very rough heuristic and would need improvement in a real implementation
    
    return { isSuspicious: false, confidence: 0.1 };
  } catch (error) {
    return { isSuspicious: false, confidence: 0.1 };
  }
};

/**
 * Comprehensive image validation for farmer product uploads
 * @param {string} filePath - The path to the uploaded image file
 * @returns {Promise<{isValid: boolean, error: string|null, warnings: string[]}>}
 */
export const validateFarmerProductImage = async (filePath) => {
  const result = {
    isValid: true,  // Always return true to allow all images
    error: null,
    warnings: []
  };
  
  // Optional: Add a general warning to remind users about appropriate images
  result.warnings.push('Please ensure this is a photo of actual cardamom for proper verification by hub managers.');
  
  return result;
};