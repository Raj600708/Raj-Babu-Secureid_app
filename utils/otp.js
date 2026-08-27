const crypto = require('crypto');

// 6-digit random OTP generate karta h

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}


//OTP ko hash karta h (SHA-256) - database main plain otp store nhi karenge

function hashOtp(otp) {
    return crypto.createHash('sha256').update(otp).digest('hex');
}


//User ne jo OTP diya, use hash karke stored hash se compare karta h 

function verifyOtp(inputOtp, storedHash) {
    const inputHash = hashOtp(inputOtp);
    return inputHash === storedHash;
}


module.exports = {generateOtp, hashOtp, verifyOtp};