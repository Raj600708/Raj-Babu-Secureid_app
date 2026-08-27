const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const User = require('../models/user');
const OtpChallenge = require('../models/OtpChallenge');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otp');

// POST /api/auth/mfa/send-otp  { email, method: 'email' | 'sms' }
async function mfaSendOtp(req, res) {
    try {
        const { email, method } = req.body;
        if (!email || !['email', 'sms'].includes(method)) {
            return res.status(400).json({ error: 'Email and valid method (email/sms) are required' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const otp = generateOtp();
        const otpHash = hashOtp(otp);

        await OtpChallenge.create({
            email,
            otpHash,
            channel: method,
            expireAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        console.log('='.repeat(40));
        console.log(`[MFA SETUP] OTP for ${email} via ${method}: ${otp}`);
        console.log('='.repeat(40));

        res.status(200).json({
            success: true,
            message: `MFA OTP sent via ${method}`,
            testOtp: otp,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /api/auth/mfa/verify-otp  { email, otp, method }
async function mfaVerifyOtp(req, res) {
    try {
        const { email, otp, method } = req.body;
        if (!email || !otp || !method) {
            return res.status(400).json({ error: 'Email, otp and method are required' });
        }

        const challenge = await OtpChallenge.findOne({ email, channel: method }).sort({ createdAt: -1 });
        if (!challenge) return res.status(400).json({ error: 'No OTP request found' });
        if (challenge.verified) return res.status(400).json({ error: 'OTP already used' });
        if (challenge.expireAt < new Date()) return res.status(400).json({ error: 'OTP has expired, please resend' });
        if (challenge.attempts >= challenge.maxAttempts) return res.status(400).json({ error: 'Maximum attempts exceeded' });

        const isValid = verifyOtp(otp, challenge.otpHash);
        if (!isValid) {
            challenge.attempts += 1;
            await challenge.save();
            return res.status(400).json({ error: 'Invalid OTP', attemptsLeft: challenge.maxAttempts - challenge.attempts });
        }

        challenge.verified = true;
        await challenge.save();

        await User.findOneAndUpdate({ email }, { isMfaEnabled: true, mfaMethod: method });

        res.status(200).json({ success: true, message: 'MFA enabled successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /api/auth/mfa/setup-authenticator  { email }
async function mfaSetupAuthenticator(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'User not found' });

        const secret = speakeasy.generateSecret({ name: `SecureID (${email})` });

        user.mfaSecret = secret.base32;
        await user.save();

        const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url);

        res.status(200).json({
            success: true,
            qrCodeDataUrl,
            manualEntryKey: secret.base32,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /api/auth/mfa/verify-authenticator  { email, token }
async function mfaVerifyAuthenticator(req, res) {
    try {
        const { email, token } = req.body;
        if (!email || !token) return res.status(400).json({ error: 'Email and token are required' });

        const user = await User.findOne({ email });
        if (!user || !user.mfaSecret) return res.status(400).json({ error: 'Authenticator not set up' });

        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1,
        });

        if (!verified) {
            return res.status(400).json({ error: 'Invalid code, please try again' });
        }

        user.isMfaEnabled = true;
        user.mfaMethod = 'authenticator';
        await user.save();

        res.status(200).json({ success: true, message: 'Authenticator app linked successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { mfaSendOtp, mfaVerifyOtp, mfaSetupAuthenticator, mfaVerifyAuthenticator };