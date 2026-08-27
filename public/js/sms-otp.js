const email = sessionStorage.getItem('pendingEmail');

if (!email) {
    window.location.href = 'index.html';
}

const phoneForm = document.getElementById('phoneForm');
const otpForm = document.getElementById('otpForm');
const phoneStep = document.getElementById('phoneStep');
const resendWrap = document.getElementById('resendWrap');
let timerInterval;

// ===== Step 1: Send OTP to phone =====
phoneForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const phone = document.getElementById('phone').value.trim();
    const sendBtn = document.getElementById('sendOtpBtn');

    const phoneRegex = /^[6-9]\d{9}$/;  // Indian 10-digit mobile numbers starting 6-9
        if (!phone || !phoneRegex.test(phone.replace(/\s+/g, ''))) {
        showAlert('Please enter a valid 10-digit mobile number');
        return;
    }

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';

try {

    const result = await apiCall('/send-sms-otp', { email, phone });

    sessionStorage.setItem('pendingPhone', phone);

    // Save test OTP for banner display
    if (result.testOtp) {
        sessionStorage.setItem('lastTestOtp', result.testOtp);
    }
    // await apiCall('/send-sms-otp', { email, phone });

    // sessionStorage.setItem('pendingPhone', phone);
    document.getElementById('userPhone').textContent = phone;

    // Switch to OTP entry view
    phoneForm.style.display = 'none';
    phoneStep.style.display = 'none';
    otpForm.style.display = 'block';
    resendWrap.style.display = 'block';

    // startTimer();
    // showAlert('Code sent! Check server console.', 'success');

    startTimer();

    if (result.testOtp) {
        showAlert(`🧪 Testing Mode — Your OTP is: ${result.testOtp}`, 'success');
    } else {
        showAlert('Code sent!', 'success');
    }

} catch (error) {
    showAlert(error.message);
    sendBtn.disabled = false;
    sendBtn.textContent = 'Send Code';
}
});

// ===== OTP box behavior =====
const otpBoxes = document.querySelectorAll('.otp-box');

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

// ===== Countdown Timer =====


function startTimer() {
  // Reset the timer HTML structure fresh every time (fixes the destroyed span bug)
    const timerText = document.getElementById('timerText');
    timerText.innerHTML = 'Code expires in <span id="countdown">10:00</span>';

    const countdownEl = document.getElementById('countdown');
    const verifyBtn = document.getElementById('verifyBtn');

  // Re-enable verify button in case it was disabled by a previous expiry
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

// ===== Step 2: Verify OTP =====
otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const otp = Array.from(otpBoxes).map(box => box.value).join('');
    const verifyBtn = document.getElementById('verifyBtn');

    if (otp.length !== 6) {
        showAlert('Please enter all 6 digits');
        return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

try {
    await apiCall('/verify-sms-otp', { email, otp });

    clearInterval(timerInterval);
    showAlert('Mobile verified! MFA enabled.', 'success');



    setTimeout(() => {
        window.location.href = 'mfa-setup.html';
    }, 1200);

    } catch (error) {
        showAlert(error.message);
        otpBoxes.forEach(box => box.value = '');
        otpBoxes[0].focus();
        verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verify';
    }
});

// ===== Change number =====
document.getElementById('changeNumber').addEventListener('click', () => {
    clearInterval(timerInterval);
    otpForm.style.display = 'none';
    resendWrap.style.display = 'none';
    phoneForm.style.display = 'block';
    phoneStep.style.display = 'block';
    document.getElementById('sendOtpBtn').disabled = false;
    document.getElementById('sendOtpBtn').textContent = 'Send Code';
});



document.getElementById('resendLink').addEventListener('click', async () => {
    const phone = sessionStorage.getItem('pendingPhone');
        try {
    const result = await apiCall('/send-sms-otp', { email, phone });

    if (result.testOtp) {
        showAlert(`🧪 Testing Mode — New OTP: ${result.testOtp}`, 'success');
    } else {
        showAlert('New code sent!', 'success');
    }

    clearInterval(timerInterval);

    // Clear old OTP boxes too, since old code is now invalid
    otpBoxes.forEach(box => box.value = '');
    otpBoxes[0].focus();

    startTimer();
    } catch (error) {
        showAlert(error.message);
    }
});