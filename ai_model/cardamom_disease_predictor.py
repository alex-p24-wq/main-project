"""
Mock AI Model for Cardamom Disease Prediction
This script demonstrates how a real AI model would work.
In production, this would be connected to a trained CNN model.
"""

import os
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
import json

class CardamomDiseasePredictor:
    def __init__(self):
        """
        Initialize the cardamom disease prediction model
        In a real implementation, this would load a pre-trained model
        """
        self.model = None
        self.class_names = [
            'healthy_cardamom',
            'leaf_spot_disease', 
            'rhizome_rot',
            'chocolate_blight',
            'capsule_rot',
            'root_wilt',
            'phylloplane_disease'
        ]
        self.load_model()
    
    def load_model(self):
        """
        Load the pre-trained model
        In a real implementation, this would load from disk
        """
        print("Loading Cardamom Disease Prediction Model...")
        
        # In a real implementation, you would load an actual trained model:
        # self.model = tf.keras.models.load_model('path/to/trained/model.h5')
        
        # For this mock implementation, we'll create a simple model structure
        # This is just for demonstration purposes
        self.model = self.create_mock_model()
        print("Model loaded successfully!")
    
    def create_mock_model(self):
        """
        Create a mock model structure for demonstration
        """
        model = Sequential([
            Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
            MaxPooling2D(2, 2),
            Conv2D(64, (3, 3), activation='relu'),
            MaxPooling2D(2, 2),
            Conv2D(128, (3, 3), activation='relu'),
            MaxPooling2D(2, 2),
            Flatten(),
            Dense(512, activation='relu'),
            Dropout(0.5),
            Dense(len(self.class_names), activation='softmax')
        ])
        return model
    
    def preprocess_image(self, image_path):
        """
        Preprocess the image for prediction
        """
        try:
            # Load and resize image
            img = Image.open(image_path)
            img = img.convert('RGB')  # Ensure RGB format
            img = img.resize((224, 224))  # Resize to model input size
            img_array = np.array(img)
            img_array = img_array.astype('float32') / 255.0  # Normalize
            img_array = np.expand_dims(img_array, axis=0)  # Add batch dimension
            return img_array
        except Exception as e:
            print(f"Error preprocessing image: {str(e)}")
            return None
    
    def predict(self, image_path):
        """
        Predict the disease in the given image
        Returns a dictionary with predictions
        """
        # Preprocess the image
        processed_img = self.preprocess_image(image_path)
        if processed_img is None:
            return {
                'success': False,
                'error': 'Could not process image'
            }
        
        # In a real implementation, you would use:
        # predictions = self.model.predict(processed_img)
        
        # For this mock implementation, we'll simulate predictions
        # based on image characteristics to make it more realistic
        predictions = self.simulate_predictions(image_path)
        
        # Convert predictions to the expected format
        result = {
            'success': True,
            'predictions': []
        }
        
        # Create prediction objects
        for i, (disease, confidence) in enumerate(predictions.items()):
            result['predictions'].append({
                'disease': disease,
                'confidence': float(confidence),
                'rank': i + 1
            })
        
        # Sort by confidence (highest first)
        result['predictions'].sort(key=lambda x: x['confidence'], reverse=True)
        
        return result
    
    def simulate_predictions(self, image_path):
        """
        Simulate predictions based on image characteristics
        This makes the mock more realistic by analyzing the image
        """
        try:
            img = Image.open(image_path)
            img_array = np.array(img)
            
            # Analyze image characteristics to make more realistic predictions
            height, width, channels = img_array.shape
            
            # Calculate average color values
            avg_color = np.mean(img_array, axis=(0, 1))
            avg_brightness = np.mean(img_array)
            
            # Calculate color diversity metrics
            std_color = np.std(img_array, axis=(0, 1))
            color_diversity = np.mean(std_color)
            
            # Calculate greenness index (NDVI-inspired for plants)
            red = img_array[:, :, 0].astype(np.float64)
            green = img_array[:, :, 1].astype(np.float64)
            blue = img_array[:, :, 2].astype(np.float64)
            
            # Greenness index (higher values indicate healthier green vegetation)
            greenness_index = np.mean((2 * green - red - blue) / (2 * green + red + blue + 1e-6))
            
            # Saturation calculation
            max_rgb = np.maximum(red, np.maximum(green, blue))
            min_rgb = np.minimum(red, np.minimum(green, blue))
            saturation = np.mean((max_rgb - min_rgb) / (max_rgb + 1e-6))
            
            # Calculate texture roughness (indicates potential spots/damage)
            # Using gradient magnitude as a proxy for texture
            grad_x = np.abs(np.gradient(img_array, axis=1))
            grad_y = np.abs(np.gradient(img_array, axis=0))
            avg_gradient = np.mean(grad_x) + np.mean(grad_y)
            
            # Calculate contrast (difference between max and min brightness)
            contrast = np.std(img_array)
            
            # Determine likely disease based on image characteristics
            predictions = {}
            
            # Healthy cardamom - determined by high greenness, good saturation, low texture roughness
            healthy_score = 0
            if greenness_index > 0.2:  # High greenness indicates health
                healthy_score += 40
            if saturation > 0.15:  # Good color saturation
                healthy_score += 20
            if avg_gradient < 50:  # Smooth texture (not spotted)
                healthy_score += 25
            if avg_brightness > 80 and avg_brightness < 220:  # Good lighting conditions
                healthy_score += 15
            
            # Apply random variation but weighted by features
            healthy_confidence = min(95, max(5, healthy_score + np.random.uniform(-10, 10)))
            predictions['healthy_cardamom'] = healthy_confidence
            
            # Disease predictions based on specific indicators
            # Leaf spot disease - indicated by high texture roughness and unusual color patterns
            spot_score = 0
            if avg_gradient > 70:  # High texture roughness suggests spots
                spot_score += 40
            if greenness_index < 0.1:  # Low greenness
                spot_score += 20
            if color_diversity > 80:  # High color variation might indicate spots
                spot_score += 25
            spot_confidence = min(80, max(5, spot_score + np.random.uniform(-10, 10)))
            predictions['leaf_spot_disease'] = spot_confidence
            
            # Rhizome rot - indicated by dark, dull appearance
            rhizome_score = 0
            if avg_brightness < 70:  # Dark image
                rhizome_score += 40
            if saturation < 0.1:  # Dull colors
                rhizome_score += 30
            if greenness_index < 0.05:  # Very low greenness
                rhizome_score += 20
            rhizome_confidence = min(70, max(5, rhizome_score + np.random.uniform(-10, 10)))
            predictions['rhizome_rot'] = rhizome_confidence
            
            # Chocolate blight - indicated by brownish colors and moderate texture
            blight_score = 0
            if avg_color[0] > avg_color[1] and avg_color[0] > avg_color[2]:  # Reddish dominance
                blight_score += 35
            if avg_gradient > 40 and avg_gradient < 90:  # Moderate texture
                blight_score += 30
            if greenness_index < 0.15 and greenness_index > 0.05:  # Low but not zero greenness
                blight_score += 25
            blight_confidence = min(75, max(5, blight_score + np.random.uniform(-10, 10)))
            predictions['chocolate_blight'] = blight_confidence
            
            # Capsule rot - indicated by bright but reddish/yellowish tones
            capsule_score = 0
            if avg_brightness > 150:  # Bright image
                capsule_score += 30
            if avg_color[0] > avg_color[2] and avg_color[1] > avg_color[2]:  # Reddish-yellowish
                capsule_score += 35
            if avg_gradient > 30:  # Some texture
                capsule_score += 25
            capsule_confidence = min(65, max(5, capsule_score + np.random.uniform(-10, 10)))
            predictions['capsule_rot'] = capsule_confidence
            
            # Root wilt - overall unhealthy appearance
            wilt_score = 0
            if avg_brightness < 100:  # Dark
                wilt_score += 25
            if saturation < 0.12:  # Dull
                wilt_score += 25
            if greenness_index < 0.1:  # Low greenness
                wilt_score += 30
            if avg_gradient > 60:  # Some texture irregularities
                wilt_score += 15
            wilt_confidence = min(70, max(5, wilt_score + np.random.uniform(-10, 10)))
            predictions['root_wilt'] = wilt_confidence
            
            # Phylloplane disease - indicated by excessive green with algal characteristics
            phyllo_score = 0
            if avg_color[1] > avg_color[0] and avg_color[1] > avg_color[2]:  # Green dominance
                phyllo_score += 30
            if avg_brightness > 160:  # Bright green
                phyllo_score += 25
            if color_diversity < 50:  # Uniform color (algal growth tends to be uniform)
                phyllo_score += 20
            if greenness_index > 0.25:  # Very high greenness
                phyllo_score += 15
            phyllo_confidence = min(60, max(5, phyllo_score + np.random.uniform(-10, 10)))
            predictions['phylloplane_disease'] = phyllo_confidence
            
            # Ensure all classes are represented with baseline probability
            for disease in self.class_names:
                if disease not in predictions:
                    predictions[disease] = np.random.uniform(5, 15)
            
            # Normalize so that the sum of all predictions is reasonable
            # The highest confidence should reflect the dominant condition
            total = sum(predictions.values())
            if total > 150:  # Scale down if too high
                for disease in predictions:
                    predictions[disease] *= 150 / total
            
            return predictions
            
        except Exception as e:
            print(f"Error simulating predictions: {str(e)}")
            # Return random predictions as fallback
            return {
                'healthy_cardamom': np.random.uniform(10, 30),
                'leaf_spot_disease': np.random.uniform(10, 30),
                'rhizome_rot': np.random.uniform(10, 30),
                'chocolate_blight': np.random.uniform(10, 30),
                'capsule_rot': np.random.uniform(10, 30),
                'root_wilt': np.random.uniform(10, 30),
                'phylloplane_disease': np.random.uniform(10, 30)
            }


# Flask API to serve the model
from flask import Flask, request, jsonify, render_template, send_from_directory
import tempfile
import os
import uuid

# Initialize Flask app
app = Flask(__name__, 
            static_url_path='',
            static_folder='static',
            template_folder='templates')

# Initialize the predictor
predictor = CardamomDiseasePredictor()

# Serve the main page
@app.route('/')
def index():
    return render_template('index.html')

# API endpoint for predictions
@app.route('/predict', methods=['POST'])
def predict_disease():
    """
    API endpoint for disease prediction
    Expects an image file in the request
    """
    # Check if the post request has the file part
    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No image file provided'
        }), 400
    
    file = request.files['image']
    
    # If user does not select file, browser also
    # submit an empty part without filename
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No selected file'
        }), 400
    
    # Check file extension
    allowed_extensions = {'png', 'jpg', 'jpeg'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({
            'success': False,
            'error': 'Invalid file type. Please upload a JPG or PNG image.'
        }), 400
    
    if file:
        try:
            # Save the file to a temporary location
            temp_dir = tempfile.mkdtemp()
            temp_path = os.path.join(temp_dir, file.filename)
            file.save(temp_path)
            
            # Get prediction
            result = predictor.predict(temp_path)
            
            # Clean up the temporary file
            os.remove(temp_path)
            os.rmdir(temp_dir)
            
            return jsonify(result)
            
        except Exception as e:
            # Clean up in case of error
            if os.path.exists(temp_path):
                if os.path.isfile(temp_path):
                    os.remove(temp_path)
                if os.path.isdir(temp_dir):
                    os.rmdir(temp_dir)
                
            return jsonify({
                'success': False,
                'error': f'Error processing image: {str(e)}'
            }), 500

# Health check endpoint
@app.route('/health')
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        'status': 'healthy',
        'model_loaded': predictor.model is not None
    })

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('static/uploads', exist_ok=True)
    
    # Run the application
    app.run(host='0.0.0.0', port=5000, debug=True)