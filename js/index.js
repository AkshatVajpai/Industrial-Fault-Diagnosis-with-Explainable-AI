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
    
    // Check login status on page load
    checkLoginStatus();
    
    // Close modal when clicking X
    closeBtn.addEventListener('click', hideLoginModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            hideLoginModal();
        }
    });
    
    // Handle login form submission
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
                // Logout
                logout().then(() => {
                    currentUser = null;
                    updateAuthButton();
                });
            } else {
                // Show login modal
                showLoginModal();
            }
        });
    }
});

const form = document.getElementById('predictionForm');
const predictBtn = document.getElementById('predictBtn');
const compareBtn = document.getElementById('compareBtn');
const loading = document.getElementById('loading');
const error = document.getElementById('error');

function getFeatures() {
    const formData = new FormData(form);
    return {
        'Air temperature [K]': parseFloat(formData.get('Air temperature [K]')),
        'Process temperature [K]': parseFloat(formData.get('Process temperature [K]')),
        'Rotational speed [rpm]': parseFloat(formData.get('Rotational speed [rpm]')),
        'Torque [Nm]': parseFloat(formData.get('Torque [Nm]')),
        'Tool wear [min]': parseFloat(formData.get('Tool wear [min]')),
        'Type_L': formData.get('equipment_type') === 'L' ? 1.0 : 0.0,
        'Type_M': formData.get('equipment_type') === 'M' ? 1.0 : 0.0
    };
}

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    error.style.display = 'none';
    predictBtn.disabled = true;
    compareBtn.disabled = true;
    loading.style.display = 'block';

    const features = getFeatures();
    const modelName = new FormData(this).get('model_name');
    const requestPayload = { model_name: modelName, features };

    try {
        const response = await fetch('/api/predict/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Prediction failed');
        }
        const result = await response.json();
        sessionStorage.setItem('predictionResult', JSON.stringify(result));
        window.location.href = '/results';
    } catch (err) {
        console.error('Error:', err);
        error.textContent = err.message || 'An error occurred during prediction';
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
        predictBtn.disabled = false;
        compareBtn.disabled = false;
    }
});

compareBtn.addEventListener('click', async function() {
    error.style.display = 'none';
    predictBtn.disabled = true;
    compareBtn.disabled = true;
    loading.style.display = 'block';

    const features = getFeatures();
    const requestPayload = { features };
    
    try {
        const response = await fetch('/api/compare/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Comparison failed');
        }
        
        const result = await response.json();
        sessionStorage.setItem('comparisonResult', JSON.stringify(result));
        window.location.href = '/compare';
    } catch (err) {
        console.error('Error:', err);
        error.textContent = err.message || 'An error occurred during comparison';
        error.style.display = 'block';
    } finally {
        loading.style.display = 'none';
        predictBtn.disabled = false;
        compareBtn.disabled = false;
    }
});
