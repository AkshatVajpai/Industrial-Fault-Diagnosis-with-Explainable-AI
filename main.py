# main.py
import uvicorn
import pandas as pd
import numpy as np
import shap
import xgboost as xgb
from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from sklearn.linear_model import LogisticRegression
import base64
import matplotlib.pyplot as plt
import io
import joblib
import json
from pydantic import BaseModel
from typing import Dict, List

app = FastAPI(title="xAI Prediction Server")

# --- Global variables to hold loaded models ---
xgb_model = None
lr_model = None
scaler = None
feature_names = None

# --- Pydantic models for validating input data ---
class PredictionRequest(BaseModel):
    model_name: str
    features: Dict[str, float]

class CompareRequest(BaseModel):
    features: Dict[str, float]

# --- Load Models on Server Startup ---
@app.on_event("startup")
def load_artifacts():
    global xgb_model, lr_model, scaler, feature_names
    print("Loading pre-trained models and artifacts...")
    try:
        xgb_model = joblib.load('models/xgb_model.joblib')
        lr_model = joblib.load('models/lr_model.joblib')
        scaler = joblib.load('models/scaler.joblib')
        with open('models/feature_names.json', 'r') as f:
            feature_names = json.load(f)
        print("Artifacts loaded successfully.")
    except FileNotFoundError:
        print("FATAL ERROR: Model files not found. Please run train.py first.")
        exit()

def get_shap_plot_base64(model, data_scaled, feature_names):
    """Generates a SHAP force plot and returns it as a base64 encoded string."""
    try:
        colors = ["#9467bd", "#2ca02c"]  # Purple and Green

        if isinstance(model, xgb.XGBClassifier):
            explainer = shap.TreeExplainer(model)
            shap_values = explainer.shap_values(data_scaled)
            base_value = explainer.expected_value
        else:
            background = scaler.transform(np.zeros((1, data_scaled.shape[1])))
            explainer = shap.LinearExplainer(model, background)
            shap_values = explainer.shap_values(data_scaled)
            base_value = explainer.expected_value

        if len(shap_values.shape) > 2:
            shap_values = shap_values[0]
        
        if shap_values.shape[0] != data_scaled.shape[1]:
            shap_values = shap_values.reshape(data_scaled.shape[1])

        short_names_map = {
            'Air temperature [K]': 'Air Temp (K)', 'Process temperature [K]': 'Process Temp (K)',
            'Rotational speed [rpm]': 'Speed (rpm)', 'Torque [Nm]': 'Torque (Nm)',
            'Tool wear [min]': 'Tool Wear (min)', 'Type_L': 'Type L', 'Type_M': 'Type M'
        }
        plot_feature_names = [short_names_map.get(fn, fn) for fn in feature_names]
        rounded_labels = [f"{name} = {val:.5f}" for name, val in zip(plot_feature_names, shap_values)]

        fig, ax = plt.subplots(figsize=(100, 20))
        
        plt.title("--- NEW PLOT VERSION ---", fontsize=40)

        shap.force_plot(
            base_value, shap_values, features=None, feature_names=rounded_labels,
            matplotlib=True, show=False, plot_cmap=colors
        )
        
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', dpi=200)
        plt.close(fig)
        buf.seek(0)
        return base64.b64encode(buf.getvalue()).decode('utf-8')
    except Exception as e:
        print(f"SHAP plot generation error: {e}")
        return ""

# --- MODIFIED: Enhanced comparison logic ---
def generate_comparison_points(xgb_shap_values, lr_shap_values, feature_names) -> List[str]:
    """Generates simple bullet points comparing the two models."""
    points = []
    
    try:
        # Get flattened SHAP values
        xgb_values = xgb_shap_values[0] if len(xgb_shap_values.shape) > 2 else xgb_shap_values
        lr_values = lr_shap_values[0] if len(lr_shap_values.shape) > 2 else lr_shap_values
        
        # Get top features
        xgb_importance = {name: abs(val) for name, val in zip(feature_names, xgb_values)}
        lr_importance = {name: abs(val) for name, val in zip(feature_names, lr_values)}
        xgb_top_feature = max(xgb_importance, key=xgb_importance.get)
        lr_top_feature = max(lr_importance, key=lr_importance.get)

        feature_display_names = {
            "Air temperature [K]": "Air Temperature", "Process temperature [K]": "Process Temperature", 
            "Rotational speed [rpm]": "Rotational Speed", "Torque [Nm]": "Torque",
            "Tool wear [min]": "Tool Wear", "Type_L": "Equipment Type (Low)", "Type_M": "Equipment Type (Medium)"
        }
        
        xgb_display = feature_display_names.get(xgb_top_feature, xgb_top_feature)
        lr_display = feature_display_names.get(lr_top_feature, lr_top_feature)

        # Point 1: Top Feature Comparison
        if xgb_top_feature == lr_top_feature:
            points.append(f"-> **Agreement on Importance:** Both models agree that **{xgb_display}** is the most important factor for this specific prediction.")
        else:
            points.append(f"-> **Different Focus:** XGBoost's decision was most influenced by **{xgb_display}**, while Logistic Regression focused more on **{lr_display}**.")

        # Point 2: NEW - Explain Model "Thinking" Style
        points.append(
            "-> **How They 'Think':** Logistic Regression assumes a simple **linear** relationship (e.g., if more torque is bad, then even more torque is always worse). In contrast, the tree-based XGBoost can learn complex, non-linear rules (e.g., 'high torque is only a major risk *if* rotational speed is also low')."
        )
        
        # Point 3: General Model Description
        points.append("-> **Complexity vs. Simplicity:** XGBoost is a more powerful model that can find intricate patterns, while Logistic Regression is simpler, faster, and easier to interpret.")
        
    except Exception as e:
        # Fallback if SHAP analysis fails
        points.append("-> Both models have been evaluated with the same input data.")
        points.append("-> XGBoost uses advanced pattern recognition, while Logistic Regression applies simpler mathematical rules.")
    
    return points

@app.post("/api/predict/")
async def predict(request: PredictionRequest):
    try:
        input_df = pd.DataFrame([request.features])
        input_df = input_df[feature_names]
        input_scaled = scaler.transform(input_df)

        model = xgb_model if request.model_name == 'xgboost' else lr_model
        
        prediction = model.predict(input_scaled)[0]
        prediction_proba = model.predict_proba(input_scaled)[0].tolist()
        shap_plot_base64 = get_shap_plot_base64(model, input_scaled, feature_names)

        return {
            "prediction": int(prediction),
            "prediction_probability": prediction_proba,
            "shap_plot": shap_plot_base64,
            "model_name": "XGBoost" if request.model_name == 'xgboost' else "Logistic Regression"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {e}")

@app.post("/api/compare/")
async def compare_models(request: CompareRequest):
    try:
        if not request.features:
            raise HTTPException(status_code=400, detail="No features provided")
        
        input_df = pd.DataFrame([request.features])
        input_df = input_df[feature_names]
        input_scaled = scaler.transform(input_df)

        xgb_pred = xgb_model.predict(input_scaled)[0]
        xgb_prob = xgb_model.predict_proba(input_scaled)[0].tolist()
        xgb_plot = get_shap_plot_base64(xgb_model, input_scaled, feature_names)
        
        try:
            xgb_explainer = shap.TreeExplainer(xgb_model)
            xgb_shap_values = xgb_explainer.shap_values(input_scaled)
        except Exception as e:
            print(f"XGBoost SHAP error: {e}")
            xgb_shap_values = np.zeros((1, len(feature_names)))

        lr_pred = lr_model.predict(input_scaled)[0]
        lr_prob = lr_model.predict_proba(input_scaled)[0].tolist()
        lr_plot = get_shap_plot_base64(lr_model, input_scaled, feature_names)
        
        try:
            background = scaler.transform(np.zeros((1, input_scaled.shape[1])))
            lr_explainer = shap.LinearExplainer(lr_model, background)
            lr_shap_values = lr_explainer.shap_values(input_scaled)
        except Exception as e:
            print(f"Logistic Regression SHAP error: {e}")
            lr_shap_values = np.zeros((1, len(feature_names)))

        comparison_points = generate_comparison_points(xgb_shap_values, lr_shap_values, feature_names)

        return {
            "xgboost": {"prediction": int(xgb_pred), "probability": xgb_prob, "shap_plot": xgb_plot},
            "logistic_regression": {"prediction": int(lr_pred), "probability": lr_prob, "shap_plot": lr_plot},
            "comparison_points": comparison_points
        }
    except Exception as e:
        print(f"Comparison endpoint error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")


@app.get("/", response_class=HTMLResponse)
async def read_root():
    with open("index.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/results", response_class=HTMLResponse)
async def read_results():
    with open("results.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/compare", response_class=HTMLResponse)
async def read_comparison_page():
    with open("compare.html", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())

@app.get("/api/debug")
async def debug_info():
    """Debug endpoint to check if models are loaded correctly"""
    try:
        return {
            "models_loaded": {
                "xgb_model": xgb_model is not None,
                "lr_model": lr_model is not None,
                "scaler": scaler is not None,
                "feature_names": feature_names
            },
            "feature_count": len(feature_names) if feature_names else 0
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)