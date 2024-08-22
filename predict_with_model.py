from flask import Flask, request, jsonify
import pandas as pd
import joblib

app = Flask(__name__)

# Load the trained model and scaler
model = joblib.load('refined_cursor_model.pkl')
scaler = joblib.load('refined_scaler.pkl')

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    cursor_data = data['cursorData']
    df = pd.DataFrame(cursor_data)

    # Feature Engineering for test data
    df['x_freq'] = df['x'].map(df['x'].value_counts())
    df['y_freq'] = df['y'].map(df['y'].value_counts())
    df['speed'] = df['timestamp'].diff().fillna(0)
    df['speed_variability'] = df['speed'].rolling(window=3).std().fillna(0)
    df['acceleration'] = df['speed'].diff().fillna(0)
    df['x_movement'] = df['x'].diff().fillna(0)
    df['y_movement'] = df['y'].diff().fillna(0)

    # Prepare features and scale the test data
    features = df[['x_freq', 'y_freq', 'speed', 'speed_variability', 'acceleration', 'x_movement', 'y_movement']]
    features_scaled = scaler.transform(features)

    # Make predictions
    predictions = model.predict(features_scaled)
    predictions_numeric = [1 if p == 'human' else 0 for p in predictions]

    # Determine the final single prediction
    final_prediction = "human" if sum(predictions_numeric) > len(predictions_numeric) / 2 else "bot"

    return jsonify(result=final_prediction)

if __name__ == '__main__':
    app.run(port=8000, debug=True)
