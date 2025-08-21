# train.py
import pandas as pd
import joblib
import json
import os
import xgboost as xgb
from sklearn.linear_model import LogisticRegression
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import StandardScaler

print("Starting model training process...")

# --- 1. Load and Preprocess Data ---
try:
    dataframe = pd.read_csv('data/equipfails.csv')
    print("Dataset 'data/equipfails.csv' loaded successfully.")
except FileNotFoundError:
    print("Error: 'data/equipfails.csv' not found. Make sure the dataset is in the 'data' folder.")
    exit()

# Drop unnecessary columns
df_processed = dataframe.drop(['UDI', 'Product ID', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF'], axis=1)

# One-hot encode the 'Type' column to handle categorical data
df_processed = pd.get_dummies(df_processed, columns=['Type'], drop_first=True)
print("Data preprocessing complete.")

# --- 2. Define Features and Target ---
X = df_processed.drop('Machine failure', axis=1)
y = df_processed['Machine failure']
feature_names = X.columns.tolist()

# --- 3. Handle Class Imbalance with SMOTE ---
smote = SMOTE(random_state=42)
X_resampled, y_resampled = smote.fit_resample(X, y)
print("Class imbalance handled using SMOTE.")

# --- 4. Scale Features ---
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X_resampled)
print("Features scaled.")

# --- 5. Train Models ---
print("Training XGBoost model...")
xgb_model = xgb.XGBClassifier(objective='binary:logistic', eval_metric='logloss', use_label_encoder=False, random_state=42)
xgb_model.fit(X_scaled, y_resampled)
print("XGBoost model trained.")

print("Training Logistic Regression model...")
lr_model = LogisticRegression(random_state=42, max_iter=1000)
lr_model.fit(X_scaled, y_resampled)
print("Logistic Regression model trained.")

# --- 6. Save Models and Artifacts ---
os.makedirs('models', exist_ok=True)

joblib.dump(xgb_model, 'models/xgb_model.joblib')
joblib.dump(lr_model, 'models/lr_model.joblib')
joblib.dump(scaler, 'models/scaler.joblib')

with open('models/feature_names.json', 'w') as f:
    json.dump(feature_names, f)

print("\nTraining complete! Models and artifacts are saved to the 'models/' directory.")
