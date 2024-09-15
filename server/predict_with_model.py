import pandas as pd
import joblib
import sys
from sklearn.preprocessing import StandardScaler

def process_file(file_path):
    # Load the test dataset
    test_data = pd.read_csv(file_path)

    # Feature Engineering for test data
    test_data['x_freq'] = test_data['x'].map(test_data['x'].value_counts())
    test_data['y_freq'] = test_data['y'].map(test_data['y'].value_counts())
    test_data['speed_variability'] = test_data['speed'].rolling(window=3).std().fillna(0)
    test_data['acceleration'] = test_data['speed'].diff().fillna(0)
    test_data['x_movement'] = test_data['x'].diff().fillna(0)
    test_data['y_movement'] = test_data['y'].diff().fillna(0)

    # Load the trained model and scaler
    model = joblib.load('server/cursor_model.pkl')
    scaler = joblib.load('server/scaler_model.pkl')

    # Prepare features and scale the test data
    features = test_data[['x_freq', 'y_freq', 'speed', 'speed_variability', 'acceleration', 'x_movement', 'y_movement']]
    features_scaled = scaler.transform(features)

    # Make predictions
    predictions = model.predict(features_scaled)
    
    # Convert predictions to numerical values (if needed)
    predictions_numeric = [1 if p == 'human' else 0 for p in predictions]

    # Determine the final single prediction
    final_prediction = "human" if sum(predictions_numeric) > len(predictions_numeric) / 2 else "Bot detected"

    return final_prediction

if __name__ == "__main__":
    # Take file path as a command-line argument
    if len(sys.argv) != 2:
        print("Usage: python predict_with_model.py <file_path>")
        sys.exit(1)

    file_path = sys.argv[1]
    print(f"Processing file: {file_path}")
    final_prediction = process_file(file_path)

    # Output the final prediction directly
    print(final_prediction)


