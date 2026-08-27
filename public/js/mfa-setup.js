const email = sessionStorage.getItem('pendingEmail');
if (!email) window.location.href = 'index.html';

let selectedMethod = null;

document.querySelectorAll('.method-option').forEach(option => {
    option.addEventListener('click', () => {
        document.querySelectorAll('.method-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        selectedMethod = option.dataset.method;
    });
});

document.getElementById('continueBtn').addEventListener('click', async () => {
    if (!selectedMethod) {
        showAlert('Please choose a method to continue');
        return;
    }

    const btn = document.getElementById('continueBtn');
        btn.disabled = true;
        btn.textContent = 'Please wait...';

    try {
        if (selectedMethod === 'authenticator') {
      // Get QR code from backend, then go to verify page
        const result = await apiCall('/mfa/setup-authenticator', { email });
        sessionStorage.setItem('mfaMethod', 'authenticator');
        sessionStorage.setItem('mfaQrCode', result.qrCodeDataUrl);
        sessionStorage.setItem('mfaSecretKey', result.manualEntryKey);
        window.location.href = 'mfa-verify.html';
    } else {
      // Email or SMS: send OTP, then go to verify page
        const result = await apiCall('/mfa/send-otp', { email, method: selectedMethod });
        sessionStorage.setItem('mfaMethod', selectedMethod);
    if (result.testOtp) {
        sessionStorage.setItem('lastTestOtp', result.testOtp);
    }
        window.location.href = 'mfa-verify.html';
    }
    } catch (error) {
        showAlert(error.message);
        btn.disabled = false;
        btn.textContent = 'Continue';
    }
});