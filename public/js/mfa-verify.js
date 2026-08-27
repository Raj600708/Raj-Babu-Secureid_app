const email = sessionStorage.getItem('pendingEmail');
const mfaMethod = sessionStorage.getItem('mfaMethod');

if (!email || !mfaMethod) {
    window.location.href = 'mfa-setup.html';
}

const otpBoxes = document.querySelectorAll('.otp-box');
let timerInterval;

// ===== Setup screen based on method =====
if (mfaMethod === 'authenticator') {
    document.getElementById('pageTitle').textContent = 'Scan QR Code';
    document.getElementById('pageSubtitle').textContent = 'Open your authenticator app and scan this code, then enter the 6-digit code it generates.';

    const qrSection = document.getElementById('qrSection');
        qrSection.style.display = 'block';
        document.getElementById('qrImage').src = sessionStorage.getItem('mfaQrCode');
        document.getElementById('secretKey').textContent = sessionStorage.getItem('mfaSecretKey');

    document.getElementById('timerText').textContent = '';

} else {
    document.getElementById('pageTitle').textContent = 'Enter the 6-digit code';
    document.getElementById('pageSubtitle').innerHTML = `Sent via ${mfaMethod === 'sms' ? 'SMS' : 'Email'} to <strong>${email}</strong>`;

  // Show test OTP banner
    const lastTestOtp = sessionStorage.getItem('lastTestOtp');
    if (lastTestOtp) {
        const banner = document.createElement('div');
        banner.style.cssText = 'background:#fef9c3; border:1px solid #fde047; color:#854d0e; padding:10px; border-radius:8px; margin-bottom:16px; font-size:13px; text-align:center;';
        banner.innerHTML = `🧪 <strong>Testing Mode</strong> — Your OTP is: <strong>${lastTestOtp}</strong>`;
        document.getElementById('alertBox').appendChild(banner);
    }

    startTimer();
}

function startTimer() {
    const timerText = document.getElementById('timerText');
    timerText.innerHTML = 'Code expires in <span id="countdown">10:00</span>';

    const countdownEl = document.getElementById('countdown');
    const verifyBtn = document.getElementById('verifyBtn');
    verifyBtn.disabled = false;

  let secondsLeft = 10 * 60;

timerInterval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        timerText.innerHTML = '<span style="color:#dc2626">Code expired.</span>';
        verifyBtn.disabled = true;
        return;
    }
    const min = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
    const sec = (secondsLeft % 60).toString().padStart(2, '0');
    countdownEl.textContent = `${min}:${sec}`;
}, 1000);
}

// ===== OTP box behavior =====
otpBoxes.forEach((box, index) => {
    box.addEventListener('input', () => {
        box.value = box.value.replace(/[^0-9]/g, '');
    if (box.value && index < otpBoxes.length - 1) {
        otpBoxes[index + 1].focus();
    }
});
    box.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !box.value && index > 0) {
        otpBoxes[index - 1].focus();
    }
});
});

// ===== Verify submit =====
document.getElementById('verifyForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const code = Array.from(otpBoxes).map(box => box.value).join('');
    const verifyBtn = document.getElementById('verifyBtn');

    if (code.length !== 6) {
    showAlert('Please enter all 6 digits');
    return;
}

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    try {
        if (mfaMethod === 'authenticator') {
            await apiCall('/mfa/verify-authenticator', { email, token: code });
    } else {
        await apiCall('/mfa/verify-otp', { email, otp: code, method: mfaMethod });
    }

    clearInterval(timerInterval);
    showAlert('MFA enabled successfully!', 'success');

    // cleanup temp storage
    sessionStorage.removeItem('mfaMethod');
    sessionStorage.removeItem('mfaQrCode');
    sessionStorage.removeItem('mfaSecretKey');
    sessionStorage.removeItem('lastTestOtp');

    setTimeout(() => {
        window.location.href = 'registration-success.html';
    }, 1200);

} catch (error) {
    showAlert(error.message);
    otpBoxes.forEach(box => box.value = '');
    otpBoxes[0].focus();
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verify';
}
});

document.getElementById('backLink').addEventListener('click', () => {
    clearInterval(timerInterval);
    window.location.href = 'mfa-setup.html';
});