# Cardamom Disease Prediction AI Model

This folder contains the AI model for predicting diseases in cardamom plants based on uploaded images.

## Setup Instructions

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. For a production setup, you would train a real model using cardamom disease datasets. The current implementation uses a mock prediction system for demonstration purposes.

3. To run the AI model server:
```bash
python cardamom_disease_predictor.py
```

The model will run on port 5001 and expect POST requests to `/api/predict` with image data.

## Integration with Frontend

The frontend connects to this AI model through the backend API at `/api/disease-prediction/predict`. The backend handles the image preprocessing and forwards requests to the AI model.

## Disease Classes

The model can predict the following diseases:
- Healthy Cardamom
- Leaf Spot Disease
- Rhizome Rot
- Chocolate Blight
- Capsule Rot
- Root Wilt Disease
- Phylloplane Disease

## Note

For a production deployment, you would need to:
1. Train the model with actual cardamom disease images
2. Fine-tune the model for better accuracy
3. Deploy the model to a production server
4. Set up proper error handling and logging