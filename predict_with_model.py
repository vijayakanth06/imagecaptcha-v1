import sys
import pandas as pd
import joblib

# Load the trained model and scaler
model = joblib.load('refined_cursor_model.pkl')
scaler = joblib.load('refined_scaler.pkl')

def process_file(file_path):
    df = pd.read_csv(file_path, header=None, names=['x', 'y', 'speed'])

    # Convert x, y, and timestamp columns to numeric (if needed)
    df['x'] = pd.to_numeric(df['x'], errors='coerce')
    df['y'] = pd.to_numeric(df['y'], errors='coerce')
    df['speed'] = pd.to_numeric(df['speed'], errors='coerce')

    # Handle any missing or invalid values after conversion
    df = df.dropna()

    # Feature Engineering for test data
    df['x_freq'] = df['x'].map(df['x'].value_counts())
    df['y_freq'] = df['y'].map(df['y'].value_counts())
    df['speed'] = df['speed'].diff().fillna(0)
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
    final_prediction = "human" if sum(predictions_numeric) > len(predictions_numeric) / 2 else "Bot detected"

    return final_prediction

if __name__ == "__main__":
    file_path = sys.argv[1]
    result = process_file(file_path)
    print(f'{{"result": "{result}"}}')
