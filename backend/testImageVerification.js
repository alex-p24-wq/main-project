import imageVerifier from './utils/imageVerification.js';
import fs from 'fs';

// Test the image verification with a sample image
async function testImageVerification() {
  try {
    console.log('Testing image verification...');
    
    // You would need to provide a path to an actual image file for testing
    // For now, we'll just log that the module loads correctly
    console.log('Image verification module loaded successfully');
    
    // If you have a test image, you can uncomment the following lines:
    /*
    const imagePath = './test-images/sample-product.jpg'; // Path to a test image
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const result = await imageVerifier.verifyImage(imageBuffer);
      console.log('Verification result:', result);
    } else {
      console.log('Test image not found. Skipping verification test.');
    }
    */
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testImageVerification();