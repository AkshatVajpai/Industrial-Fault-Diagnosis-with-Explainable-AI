document.addEventListener('DOMContentLoaded', () => {
    try {
        const resultData = sessionStorage.getItem('comparisonResult');
        if (!resultData) {
            document.body.innerHTML = '<h1>Error: No data found. Please <a href="/">go back and try again</a>.</h1>';
            return;
        }
        const data = JSON.parse(resultData);
        
        const xgbPredictionBox = document.getElementById('xgb-prediction');
        const xgbIsFail = data.xgboost.prediction === 1;
        xgbPredictionBox.classList.add(xgbIsFail ? 'fail' : 'normal');
        xgbPredictionBox.innerHTML = `
            <div class="prediction-text ${xgbIsFail ? 'fail' : 'normal'}">${xgbIsFail ? 'Failure Imminent' : 'Normal Operation'}</div>
            <div class="probability">
                <div>Normal: ${(data.xgboost.probability[0] * 100).toFixed(3)}%</div>
                <div>Failure: ${(data.xgboost.probability[1] * 100).toFixed(3)}%</div>
            </div>
        `;
        if (data.xgboost.shap_plot) {
            document.getElementById('xgb-shap-plot').src = `data:image/png;base64,${data.xgboost.shap_plot}`;
        } else {
            document.getElementById('xgb-shap-plot').alt = 'SHAP plot unavailable';
            document.getElementById('xgb-shap-plot').style.display = 'none';
        }

        const lrPredictionBox = document.getElementById('lr-prediction');
        const lrIsFail = data.logistic_regression.prediction === 1;
        lrPredictionBox.classList.add(lrIsFail ? 'fail' : 'normal');
        lrPredictionBox.innerHTML = `
            <div class="prediction-text ${lrIsFail ? 'fail' : 'normal'}">${lrIsFail ? 'Failure Imminent' : 'Normal Operation'}</div>
            <div class="probability">
                <div>Normal: ${(data.logistic_regression.probability[0] * 100).toFixed(3)}%</div>
                <div>Failure: ${(data.logistic_regression.probability[1] * 100).toFixed(3)}%</div>
            </div>
        `;
        if (data.logistic_regression.shap_plot) {
            document.getElementById('lr-shap-plot').src = `data:image/png;base64,${data.logistic_regression.shap_plot}`;
        } else {
            document.getElementById('lr-shap-plot').alt = 'SHAP plot unavailable';
            document.getElementById('lr-shap-plot').style.display = 'none';
        }
    
        const pointsList = document.getElementById('comparison-points');
        data.comparison_points.forEach(point => {
            const li = document.createElement('li');
            li.innerHTML = point;
            pointsList.appendChild(li);
        });
    } catch (error) {
        console.error("Error rendering comparison page:", error);
        document.body.innerHTML = `<h1>An error occurred while displaying the results. Please check the console for details and try again.</h1>`;
    }
});
