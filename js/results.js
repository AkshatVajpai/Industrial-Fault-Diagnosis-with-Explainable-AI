// --- PHP-based authentication ---
let currentUser = null;

function updateAuthButton() {
    const btn = document.getElementById('authBtn');
    if (!btn) return;
    
    if (currentUser && currentUser.username) {
        btn.textContent = 'Logout';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-danger');
        btn.title = `Logged in as ${currentUser.username}`;
        btn.setAttribute('aria-label', 'Logout');
    } else {
        btn.textContent = 'Login';
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-primary');
        btn.title = 'Login to your account';
        btn.setAttribute('aria-label', 'Login');
    }
}

function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function hideLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginForm').reset();
}

function checkLoginStatus() {
    const formData = new FormData();
    formData.append('action', 'check');
    
    fetch('auth.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = { username: data.username };
        } else {
            currentUser = null;
        }
        updateAuthButton();
    })
    .catch(error => {
        console.error('Error checking login status:', error);
        currentUser = null;
        updateAuthButton();
    });
}

function login(username, password) {
    const formData = new FormData();
    formData.append('action', 'login');
    formData.append('username', username);
    formData.append('password', password);
    
    return fetch('auth.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json());
}

function logout() {
    const formData = new FormData();
    formData.append('action', 'logout');
    
    return fetch('auth.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json());
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('authBtn');
    const modal = document.getElementById('loginModal');
    const closeBtn = modal.querySelector('.close');
    const loginForm = document.getElementById('loginForm');
    
    checkLoginStatus();
    
    closeBtn.addEventListener('click', hideLoginModal);
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            hideLoginModal();
        }
    });
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const username = formData.get('username');
        const password = formData.get('password');
        
        try {
            const result = await login(username, password);
            if (result.success) {
                currentUser = { username: result.username };
                updateAuthButton();
                hideLoginModal();
            } else {
                document.getElementById('loginError').textContent = result.message || 'Login failed';
                document.getElementById('loginError');
                document.getElementById('loginError').style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            document.getElementById('loginError').textContent = 'An error occurred during login';
            document.getElementById('loginError').style.display = 'block';
        }
    });
    
    if (btn) {
        btn.addEventListener('click', () => {
            if (currentUser && currentUser.username) {
                logout().then(() => {
                    currentUser = null;
                    updateAuthButton();
                });
            } else {
                showLoginModal();
            }
        });
    }
});

window.addEventListener('load', () => {
    const resultsContent = document.getElementById('results-content');
    const resultDataString = sessionStorage.getItem('predictionResult');

    if (!resultDataString) {
        resultsContent.innerHTML = `
            <h2>No prediction data found.</h2>
            <p style="color: var(--text-secondary); margin-top: 1rem;">Please return to the main page to make a prediction.</p>
        `;
        return;
    }

    const result = JSON.parse(resultDataString);
    const isFailure = result.prediction === 1;
    const probNormal = result.prediction_probability[0];
    const probFailure = result.prediction_probability[1];

    resultsContent.innerHTML = `
        <div class="prediction-box ${isFailure ? 'prediction-fail' : 'prediction-normal'}">
            ${isFailure ? 'Machine Failure Likely' : 'Normal Operation'}
        </div>

        <div class="probabilities">
            <h3>Prediction Probabilities</h3>
            <div class="prob-bar-container">
                <div class="prob-bar-normal" style="width: ${probNormal * 100}%;" title="Normal: ${(probNormal * 100).toFixed(1)}%"></div>
                <div class="prob-bar-fail" style="width: ${probFailure * 100}%;" title="Failure: ${(probFailure * 100).toFixed(1)}%"></div>
            </div>
        </div>

        <div class="shap-section">
            <h3>Explanation of AI prediction</h3>
            
            <div style="background-color: rgba(88, 166, 255, 0.1); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; border-left: 4px solid var(--primary-accent);">
                <h4 style="margin: 0 0 0.5rem 0; color: var(--primary-accent);">Quick Summary:</h4>
                <p style="margin: 0; color: var(--text-secondary); line-height: 1.6;">
                    Your equipment is predicted to operate safely because the overall sensor readings suggest normal conditions. 
                    The chart below shows exactly how each sensor reading influenced this decision - 
                    <span style=\"color: var(--color-fail);\">red bars indicate risk factors</span>, 
                    <span style=\"color: var(--primary-accent);\">blue bars indicate safe conditions</span>.
                </p>
            </div>
            
            <img id=\"shap-plot\" src=\"data:image/png;base64,${result.shap_plot}\" alt=\"SHAP Explanation Plot\" class=\"shap-plot\"/>
        </div>

        <div class="guide-section">
            <h3>Understanding the Explanation Chart</h3>
            
            <div class="guide-item">
                <div class="icon" style="color: var(--color-fail);">🔴</div>
                <div>
                    <p><strong>Red Bars (Push Right →):</strong> These are **risk factors** pushing the prediction towards **Failure**. Longer red bars have a stronger negative impact.</p>
                </div>
            </div>
            
            <div class="guide-item">
                <div class="icon" style="color: var(--primary-accent);">🔵</div>
                <div>
                    <p><strong>Blue Bars (Push Left ←):</strong> These are **positive factors** pushing the prediction towards **Normal Operation**. Longer blue bars have a stronger positive impact.</p>
                </div>
            </div>
            
            <div class="guide-item">
                <div class="icon">-></div>
                <div>
                    <p><strong>Base Value:</strong> This is the neutral starting point, representing the average prediction across all historical data before considering this specific machine's data.</p>
                </div>
            </div>

            <div class="guide-item">
                <div class="icon">-></div>
                <div>
                    <p><strong>Final Score f(x):</strong> This is the final output after all factors are combined.
                        <br>• A **negative score (< 0)** means the blue bars won, predicting **Normal Operation**.
                        <br>• A **positive score (> 0)** means the red bars won, predicting a **Failure Risk**.
                    </p>
                </div>
            </div>
            
            <div class="guide-item">
                <div class="icon">-></div>
                <div>
                    <p><strong>Key Takeaway:</strong> The final prediction is a balance of all factors. Even if you see some red risk factors, the machine is predicted to be safe as long as the blue "safe" factors are stronger and pull the final score into the negative range.</p>
                </div>
            </div>
        </div>
    `;
});
