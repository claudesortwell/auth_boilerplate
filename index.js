const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import Routes
const authRoute = require("./routes/auth");

// Setting up Enviroment config file
dotenv.config();

// Connect to DB
mongoose.connect(
    process.env.DB_CONNECT, 
    { useNewUrlParser: true },
    () => console.log('Connected to MongoDB')
);

// Body Parser to read (Middleware)
app.use(express.json());

// Sanitizing all the req.bodys to prevent XSS
var reqSanitizer = require('req-sanitizer');
app.use(reqSanitizer());

// Route Middlewares
app.use('/api/user', authRoute);

app.listen(3000, () => console.log('Server Up and running'));