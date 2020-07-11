const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Import Routes
const authRoute = require("./routes/auth");

// Setting up Enviroment config file
dotenv.config();

// Connect to DB
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true }, () =>
	console.log("Connected to MongoDB")
);

// Body Parser to read (Middleware)
app.use(express.json());

// Sanitizing all the req.bodys to prevent XSS
var reqSanitizer = require("req-sanitizer");
app.use(reqSanitizer());

app.use(function (req, res, next) {
	var allowedOrigins = ["http://localhost:3001"];
	var origin = req.headers.origin;
	if (allowedOrigins.indexOf(origin) > -1) {
		res.setHeader("Access-Control-Allow-Origin", origin);
	}
	// res.header("Access-Control-Allow-Origin", "http://127.0.0.1:8020");
	res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
	res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
	res.header("Access-Control-Allow-Credentials", true);
	return next();
});

// Route Middlewares
app.use("/api/user", authRoute);

app.listen(3000, () => console.log("Server Up and running"));
