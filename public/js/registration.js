document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const submitBtn = document.getElementById('submitBtn');


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    showAlert('Please enter a valid email address');
    return;
}

if (password !== confirmPassword) {
    showAlert('Passwords do not match');
    return;
}

if (password !== confirmPassword) {
    showAlert('Passwords do not match');
    return;
    }

if (password.length < 6) {
    showAlert('Password must be at least 6 characters');
    return;
    }

submitBtn.disabled = true;
submitBtn.textContent = 'Please wait...';

    try {
    const result = await apiCall('/register', { name, email, password });

    // Save email for the OTP page to use
    sessionStorage.setItem('pendingEmail', email);


        // Pass the test OTP forward to the next page (only for this assignment)
    if (result.testOtp) {
        sessionStorage.setItem('lastTestOtp', result.testOtp);
    }

    showAlert('Registered! Redirecting to OTP verification...', 'success');

    setTimeout(() => {
        window.location.href = 'email-otp.html';
    }, 1200);

} catch (error) {
    showAlert(error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = 'Sign Up';
    }
});