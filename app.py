from flask import Flask, render_template, request, jsonify #activate environment using .\filsign\Scripts\Activate.ps1 and ngrok http 5000
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.layers import Layer
from flask_socketio import SocketIO, emit
from flask_cors import CORS  # Import CORS

import os
app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
# Set up CORS for regular HTTP routes
CORS(app, resources={r"/*": {"origins": "*"}})  # Allow all origins for all routes

# Set up SocketIO with CORS
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Load your actions array
actions = np.array(['afternoon', 'again', 'bye', 'deaf', 'dont_understand',
                    'evening', 'fast', 'fine', 'good', 'hello', 'how', 'how_much',
                    'job', 'later', 'maybe', 'morning', 'name', 'nice_to_meet',
                    'night', 'no', 'no_sign', 'please', 'see you', 'sign_language',
                    'slow', 'sorry', 'take_care', 'thank_you', 'today', 'tomorrow',
                    'understand', 'wait', 'welcome', 'what', 'when', 'where',
                    'who', 'why', 'which', 'yes', 'yesterday', 'you'])

# Load model
model = None

def load_lstm_model():
    global model
    model = load_model('94model.h5')
    print("Model loaded successfully!")

@app.route('/')
def index():
    return render_template('index.html')

# Keep the HTTP endpoint for compatibility
@app.route('/predict', methods=['POST'])
def predict():
    if request.method == 'POST':
        # Get keypoints data from the request
        keypoints_data = request.json.get('keypoints', [])
        
        # Process data and make prediction
        result = process_prediction(keypoints_data)
        
        if 'error' in result:
            return jsonify(result), 400
            
        return jsonify(result)

# Process prediction data and return results
def process_prediction(keypoints_data):
    try:
        # Convert to numpy array
        sequence = np.array(keypoints_data)
        
        # Ensure we have the right shape for prediction
        if sequence.shape[0] != 40:
            return {'error': 'Need exactly 30 frames of keypoints'}
        
        # Add batch dimension
        sequence_batch = np.expand_dims(sequence, axis=0)
        res = model.predict(sequence_batch)[0]
        
        # Get the predicted action
        predicted_action = actions[np.argmax(res)]
        confidence = float(res[np.argmax(res)])
        
        # Get top predictions
        top_indices = np.argsort(res)[::-1][:5]  # Get top 5 predictions
        top_actions = [actions[i] for i in top_indices]
        top_probabilities = [float(res[i]) for i in top_indices]
        
        return {
            'prediction': predicted_action,
            'confidence': confidence,
            'top_predictions': [{'action': action, 'probability': prob} 
                              for action, prob in zip(top_actions, top_probabilities)]
        }
    except Exception as e:
        return {'error': str(e)}

# WebSocket endpoint for predictions
@socketio.on('predict_sign')
def handle_prediction(data):
    try:
        # Get keypoints data from the WebSocket message
        keypoints_data = data.get('keypoints', [])
        
        # Process prediction
        result = process_prediction(keypoints_data)
        
        if 'error' in result:
            emit('prediction_error', {'error': result['error']})
            return
        
        # Send prediction back to all clients (including the sender)
        emit('prediction_result', result, broadcast=True)
        
    except Exception as e:
        emit('prediction_error', {'error': str(e)})

# WebSocket connection event
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'status': 'Connected to server'})

# WebSocket disconnection event
@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    # Initialize model
    load_lstm_model()
    
    # Run Flask app with SocketIO - bind to all interfaces
    # Make sure to use 0.0.0.0 to accept connections from any IP
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)