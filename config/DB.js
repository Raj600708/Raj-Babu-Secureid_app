const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/secureid';
        await mongoose.connect(mongoUri);
        console.log('MongoDB is Connected');
    } catch (err) {
        console.log('MongoDB is not connected:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;