const mongoose = require('mongoose');


const otpChallengeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },

    otpHash: {
        type: String,
        required: true,
    },

    channel: {
        type: String,
        enum: ['email', 'sms'],
        default: 'email',
    },

    expireAt: {
        type: Date,
        required: true,
    },

    attempts: {
        type: Number,
        default: 0,
    },

    maxAttempts: {
        type: Number,
        default: 3,
    },

    verified: {
        type: Boolean,
        default: false,
    },
}, {timestamps: true});


module.exports = mongoose.model('otpChallenge', otpChallengeSchema);