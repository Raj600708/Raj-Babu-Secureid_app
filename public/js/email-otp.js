
// Get email saved during registration
const email = sessionStorage.getItem('pendingEmail');


if (!email) {
  window.location.href = 'index.html';
}


document.getElementById('userEmail').textContent = email;

// Show test OTP banner (for evaluator/testing purposes)
const lastTestOtp = sessionStorage.getItem('lastTestOtp');
if (lastTestOtp) {
  const banner = document.createElement('div');
  banner.style.cssText = 'background:#fef9c3; border:1px solid #fde047; color:#854d0e; padding:10px; border-radius:8px; margin-bottom:16px; font-size:13px; text-align:center;';
  banner.innerHTML = `🧪 <strong>Testing Mode</strong> — Your OTP is: <strong>${lastTestOtp}</strong>`;
  document.getElementById('alertBox').appendChild(banner);
}



// ===== OTP box auto-focus behavior =====
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
let timerInterval;

function startTimer() {
  // Reset the timer HTML structure fresh every time (fixes the destroyed span bug)
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

startTimer();

// ===== Form Submit (Verify OTP) =====
document.getElementById('otpForm').addEventListener('submit', async (e) => {
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
    await apiCall('/verify-email-otp', { email, otp });

    clearInterval(timerInterval);
    showAlert('Email verified! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = 'sms-otp.html';
    }, 1200);

  } catch (error) {
    showAlert(error.message);
    otpBoxes.forEach(box => box.value = '');
    otpBoxes[0].focus();
    verifyBtn.disabled = false;
    verifyBtn.textContent = 'Verify';
  }
});

// ===== Resend Code =====



document.getElementById('resendLink').addEventListener('click', async () => {
  try {
    const result = await apiCall('/register-resend-email-otp', { email });

    if (result.testOtp) {
      sessionStorage.setItem('lastTestOtp', result.testOtp);
      showAlert(`🧪 Testing Mode — Your new OTP is: ${result.testOtp}`, 'success');
    } else {
      showAlert('New code sent!', 'success');
    }

    clearInterval(timerInterval);
    otpBoxes.forEach(box => box.value = '');
    otpBoxes[0].focus();
    startTimer();
  } catch (error) {
    showAlert(error.message);
  }
});