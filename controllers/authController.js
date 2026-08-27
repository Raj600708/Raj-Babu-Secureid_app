const bcrypt = require('bcryptjs');
const User = require('../models/user');
const OtpChallenge = require('../models/OtpChallenge');
const { generateOtp, hashOtp, verifyOtp } = require('../utils/otp');


//POST /api/auth/register

async function register(req, res) {
    try {
        console.log('Request Body:', req.body);
        const{ name, email, password } = req.body;


        //1. Validations kar rhe h
        if(!name || !email || !password) {
            return res.status(400).json({error: 'All fields are required'});
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
    
        //2. check is user already exist h ya nhi
        const existingUser = await User.findOne({ email });
        if(existingUser) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        //3. Ab isse Password ko hash karenge
        const hashPassword = await bcrypt.hash(password, 10);

        //4. Create user (unverified for now)
        const newUser = await User.create({
            name,
            email,
            password: hashPassword,
        });

        //5. Generate OTP and hash it
        const otp = generateOtp();
        const otpHash = hashOtp(otp);

        //6. Create OTP Challenge (expires in 10 minutes)
        await OtpChallenge.create({
            email,
            otpHash,
            channel: 'email',
            expireAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        //7. simulate sending email (print to console for now)
        console.log('='.repeat(40));
        console.log(`OTP for ${email}: ${otp}`);
        console.log('='.repeat(40));


        //8. send response
        res.status(201).json({
            success: true,
            message: 'Registered! OTP sent to email',
            userID: newUser._id,
            testOtp: otp,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// POST /api/auth/register-resend-email-otp
async function resendEmailOtp(req, res) {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (user.isEmailVerified) {
            return res.status(400).json({ error: 'Email is already verified' });
        }

        const otp = generateOtp();
        const otpHash = hashOtp(otp);

        await OtpChallenge.create({
            email,
            otpHash,
            channel: 'email',
            expireAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        console.log('='.repeat(40));
        console.log(`OTP for ${email}: ${otp}`);
        console.log('='.repeat(40));

        res.status(200).json({
            success: true,
            message: 'New OTP sent to email',
            testOtp: otp,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}




// POST /api/auth/verify-email-otp
async function verifyEmailOtp(req, res) {
    try {
        const { email, otp } = req.body;

        // 1. Validation
        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        // 2. Find the latest OTP challenge for this email
        const challenge = await OtpChallenge.findOne({ email, channel: 'email' }).sort({ createdAt: -1 });

        if (!challenge) {
            return res.status(400).json({ error: 'No OTP request found for this email' });
        }

        // 3. Check if already verified
        if (challenge.verified) {
            return res.status(400).json({ error: 'OTP already used' });
        }

        // 4. Check expiry
        if (challenge.expireAt < new Date()) {
            return res.status(400).json({ error: 'OTP has expired, please request a new one' });
        }

        // 5. Check max attempts
        if (challenge.attempts >= challenge.maxAttempts) {
            return res.status(400).json({ error: 'Maximum attempts exceeded, please request a new OTP' });
        }

        // 6. Verify OTP
        
        const isValid = verifyOtp(otp, challenge.otpHash);

        if (!isValid) {
            challenge.attempts += 1;
            await challenge.save();
            return res.status(400).json({ error: 'Invalid OTP', attemptsLeft: challenge.maxAttempts - challenge.attempts });
        }

        // 7. Mark challenge as verified
        challenge.verified = true;
        await challenge.save();

        // 8. Mark user's email as verified
        await User.findOneAndUpdate({ email }, { isEmailVerified: true });

        res.status(200).json({
            success: true,
            message: 'Email verified successfully!'
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}



// POST /api/auth/send-sms-otp
async function sendSmsOtp(req, res) {
    try {
        const { email, phone } = req.body;

        if (!email || !phone) {
            return res.status(400).json({ error: 'Email and phone number are required' });
        }

        const phoneRegex = /^[6-9]\d{9}$/;
            if (!phoneRegex.test(phone)) {
            return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // 1. Check user exists and email is verified
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }
        if (!user.isEmailVerified) {
            return res.status(400).json({ error: 'Please verify your email first' });
        }

        // 2. Save phone number on user
        user.phone = phone;
        await user.save();

        // 3. Generate OTP and hash it
        const otp = generateOtp();
        const otpHash = hashOtp(otp);

        // 4. Create OTP challenge for sms channel
        await OtpChallenge.create({
            email,
            otpHash,
            channel: 'sms',
            expireAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        // 5. Simulate SMS (print to console)
        console.log('='.repeat(40));
        console.log(`📱 [SIMULATED SMS] OTP for ${phone}: ${otp}`);
        console.log('='.repeat(40));

        res.status(200).json({
            success: true,
            message: 'OTP sent to mobile',
            testOtp: otp,
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// POST /api/auth/verify-sms-otp
async function verifySmsOtp(req, res) {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'Email and OTP are required' });
        }

        const challenge = await OtpChallenge.findOne({ email, channel: 'sms' }).sort({ createdAt: -1 });

        if (!challenge) {
            return res.status(400).json({ error: 'No OTP request found for this number' });
        }

        if (challenge.verified) {
            return res.status(400).json({ error: 'OTP already used' });
        }

        if (challenge.expireAt < new Date()) {
            return res.status(400).json({ error: 'OTP has expired, please request a new one' });
        }

        if (challenge.attempts >= challenge.maxAttempts) {
            return res.status(400).json({ error: 'Maximum attempts exceeded, please request a new OTP' });
        }

        const isValid = verifyOtp(otp, challenge.otpHash);

        if (!isValid) {
            challenge.attempts += 1;
            await challenge.save();
            return res.status(400).json({
                error: 'Invalid OTP',
                attemptsLeft: challenge.maxAttempts - challenge.attempts
            });
        }

        challenge.verified = true;
        await challenge.save();

        // Mark phone verified AND enable MFA (registration complete)
        await User.findOneAndUpdate(
            { email },
            { isPhoneVerified: true, isMfaEnabled: true }
        );

        res.status(200).json({
            success: true,
            message: 'Phone verified! MFA enabled. Registration complete.'
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}




async function testGetOtp(req, res) {
    try {
        const { email, channel } = req.query;

        if (!email) {
            return res.status(400).json({ error: 'Email is required as query param' });
        }

        const searchChannel = channel || 'email';

        const challenge = await OtpChallenge.findOne({ email, channel: searchChannel }).sort({ createdAt: -1 });

        if (!challenge) {
            return res.status(404).json({ error: 'No OTP challenge found for this email/channel' });
        }

        

        const otp = generateOtp();
        const otpHash = hashOtp(otp);

        challenge.otpHash = otpHash;
        challenge.attempts = 0;
        challenge.expireAt = new Date(Date.now() + 10 * 60 * 1000);
        await challenge.save();

        res.status(200).json({
            success: true,
            note: 'TEST-ONLY endpoint — for evaluator use',
            email,
            channel: searchChannel,
            otp,
            expiresInMinutes: 10
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { register, verifyEmailOtp, sendSmsOtp, verifySmsOtp, resendEmailOtp, testGetOtp };



