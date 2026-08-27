const express = require('express');
const router = express.Router();
const { register, verifyEmailOtp, sendSmsOtp, verifySmsOtp, resendEmailOtp, testGetOtp } = require('../controllers/authController');
const { mfaSendOtp, mfaVerifyOtp, mfaSetupAuthenticator, mfaVerifyAuthenticator } = require('../controllers/mfaController');

router.post('/register', register);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/send-sms-otp', sendSmsOtp);
router.post('/verify-sms-otp', verifySmsOtp);
router.post('/register-resend-email-otp', resendEmailOtp);
router.get('/test-get-otp', testGetOtp);

router.post('/mfa/send-otp', mfaSendOtp);
router.post('/mfa/verify-otp', mfaVerifyOtp);
router.post('/mfa/setup-authenticator', mfaSetupAuthenticator);
router.post('/mfa/verify-authenticator', mfaVerifyAuthenticator);

module.exports = router;