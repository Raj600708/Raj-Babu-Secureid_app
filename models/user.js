const mongoose = require('mongoose');
const { type } = require('node:os');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },

    phone: {
        type: String,
        trim: true,
    },

    password:{
        type: String,
        required: true,
    },

    isEmailVerified:{
        type: Boolean,
        default: false,
    },

    isPhoneVerified: {
        type: Boolean,
        default: false,
    },

    isMfaEnabled: {
        type: Boolean,
        default: false,
    },

    mfaMethod: {
        type: String,
        enum: ['email', 'sms', 'authenticator', null],
        default: null,
    },

    mfaSecret: {
        type: String,
    },

}, {timestamps: true});


module.exports = mongoose.model('User', userSchema);