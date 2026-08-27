const API_URL = 'http://localhost:8080/api/auth';

async function apiCall(endpoint, data) {
    const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
    throw new Error(result.error || 'Something went wrong');
    }

    return result;
}

function showAlert(message, type = 'error') {
    const alertBox = document.getElementById('alertBox');
    alertBox.innerHTML = `<div class="alert alert-${type}">${message}</div>`;

    if (type === 'error') {
    setTimeout(() => { alertBox.innerHTML = ''; }, 4000);
    }
}