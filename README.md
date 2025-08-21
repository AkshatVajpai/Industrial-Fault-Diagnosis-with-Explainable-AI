# xAI - Machine Failure Prediction System

An explainable AI (xAI) system that predicts industrial equipment failures using machine learning, providing interpretable predictions with SHAP visualizations.

## 🎯 Project Overview

This system analyzes sensor data from industrial equipment to predict potential machine failures. It uses advanced machine learning models (XGBoost and Logistic Regression) combined with SHAP (SHapley Additive exPlanations) to provide both accurate predictions and understandable explanations of why those predictions were made.

## ✨ Features

- **Dual Model Support**: XGBoost (recommended) and Logistic Regression
- **Explainable AI**: SHAP plots showing feature importance and impact
- **Real-time Predictions**: Web-based interface for instant failure predictions
- **Class Imbalance Handling**: SMOTE oversampling for better model performance
- **Modern Web UI**: Responsive, dark-themed interface
- **RESTful API**: Programmatic access to prediction services

## 🏗️ Architecture

```
├── data/                  # Dataset storage
│   └── equipfails.csv    # Equipment failure dataset
├── models/                # Trained models (generated)
├── main.py               # FastAPI web server
├── train.py              # Model training script
├── index.html            # Main prediction interface
├── results.html          # Results display page
└── requirements.txt      # Python dependencies
```

## 📊 Dataset

The system uses the `equipfails.csv` dataset containing:
- **Sensor Readings**: Air temperature, process temperature, rotational speed, torque, tool wear
- **Equipment Type**: L (Low), M (Medium), H (High)
- **Target Variable**: Machine failure (binary: 0 = Normal, 1 = Failure)
- **Additional Features**: Various failure type indicators

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip package manager

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Train the Models
```bash
python train.py
```
This creates the `models/` directory with trained models and preprocessing artifacts.

### Step 3: Start the Web Server
```bash
python main.py
```

### Step 4: Access the Application
Open your browser and navigate to:
```
http://localhost:8000
```

## 🔧 Usage

### Making Predictions

1. **Input Sensor Data:**
   - Air Temperature [K]: Equipment air temperature
   - Process Temperature [K]: Process operating temperature
   - Rotational Speed [rpm]: Equipment rotation speed
   - Torque [Nm]: Applied torque
   - Tool Wear [min]: Tool wear time
   - Equipment Type: L, M, or H

2. **Select Model:**
   - **XGBoost**: Recommended for best performance
   - **Logistic Regression**: Faster, more interpretable

3. **Get Results:**
   - Binary prediction (Failure/Normal)
   - Probability scores
   - SHAP explanation plot

### API Usage

```python
import requests

# Make prediction via API
response = requests.post('http://localhost:8000/api/predict/', json={
    "model_name": "xgboost",
    "features": {
        "Air temperature [K]": 300.0,
        "Process temperature [K]": 310.0,
        "Rotational speed [rpm]": 1500,
        "Torque [Nm]": 40.0,
        "Tool wear [min]": 100,
        "Type_L": 0.0,
        "Type_M": 1.0
    }
})

result = response.json()
print(f"Prediction: {result['prediction']}")
print(f"Probabilities: {result['prediction_probability']}")
```

## 📁 File Structure

- **`main.py`**: FastAPI web server with prediction endpoints
- **`train.py`**: Data preprocessing and model training pipeline
- **`index.html`**: Main prediction interface
- **`results.html`**: Results visualization page
- **`requirements.txt`**: Python package dependencies
- **`data/equipfails.csv`**: Training dataset

## 🧠 Machine Learning Details

### Data Preprocessing
- Feature scaling using StandardScaler
- One-hot encoding for categorical variables
- SMOTE oversampling for class imbalance

### Models
- **XGBoost**: Gradient boosting classifier with optimized hyperparameters
- **Logistic Regression**: Linear model with regularization

### Explainability
- SHAP force plots showing feature contributions
- Color-coded explanations (red = failure, blue = normal)

## 🚨 Troubleshooting

### Common Issues

**"Model files not found" Error:**
- Ensure you ran `python train.py` before starting the server
- Check that `models/` directory exists with all required files

**Import Errors:**
- Verify all dependencies are installed: `pip install -r requirements.txt`
- Check Python version compatibility

**Port Already in Use:**
- Change port in `main.py` or kill existing process
- Use `netstat -ano | findstr :8000` (Windows) or `lsof -i :8000` (Linux/Mac)

### File Dependencies
```
models/
├── xgb_model.joblib      # Trained XGBoost model
├── lr_model.joblib       # Trained Logistic Regression model
├── scaler.joblib         # Feature scaler
└── feature_names.json    # Feature names for preprocessing
```

## 🔒 Security Considerations

- Input validation on all sensor parameters
- Rate limiting for API endpoints (consider adding)
- Authentication for production deployments (recommended)

## 🚀 Production Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Environment Variables
```bash
export MODEL_PATH="./models"
export HOST="0.0.0.0"
export PORT="8000"
```

### Reverse Proxy (Nginx)
```nginx
location / {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 📈 Performance

- **Training Time**: ~30-60 seconds (depending on hardware)
- **Prediction Time**: <100ms per request
- **Model Size**: ~2-5MB total
- **Memory Usage**: ~100-200MB

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review error logs in the console
3. Verify all dependencies are correctly installed
4. Ensure the training script completed successfully

---

**Built with ❤️ using FastAPI, XGBoost, SHAP, and modern web technologies**
