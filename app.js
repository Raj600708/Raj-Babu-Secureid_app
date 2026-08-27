const express = require('express');
require('dotenv').config();
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require("./config/DB");
const authRoutes = require('./routes/authRoutes');
const path = require('path');

connectDB();


const app = express();
const port = process.env.PORT || 8080;
// const port = 8080;


app.use(cors());
app.use(express.json());
// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
    res.send("Root is connected");
});



// app.listen(8080, () => {
//     console.log(`Server is running on ${port}`);
// });

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});