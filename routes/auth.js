const router = require("express").Router();
const User = require("../model/User");
const { registerValidation } = require("../joi/validation");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");

// Setting up Enviroment config file
dotenv.config();

// Nodemailer setup
var transporter = nodemailer.createTransport({
	pool: true,
	host: "ventraip.email",
	port: 587,
	sendMail: true,
	secure: false, // true for 465, false for other ports
	auth: {
		user: "claude@grillstudy.com", // your domain email address
		pass: process.env.EMAIL_PASSWORD, // your password
	},
	tls: {
		// do not fail on invalid certs
		rejectUnauthorized: false,
	},
});

// verify connection configuration
transporter.verify(function (error, success) {
	if (error) {
		console.log(error);
	} else {
		console.log("Server is ready to take our messages");
	}
});

var mailOptions = {
	from: '"GrillStudy" <claude@grillstudy.com>',
	to: "yestinator@gmail.com",
	subject: "GrillStudy Email Verification",
	html: "Hello ",
};

// send mail with defined transport object
transporter.sendMail(mailOptions, function (error, info) {
	if (error) {
		return console.log(error);
	}
	console.log("Message sent: " + info.response);
});

// Register
router.post("/register", async (req, res) => {
	// Validating users register data
	const { error } = registerValidation(req.body);
	// If the submitted user details have a error return details of error and status 400
	if (error) return res.status(400).send(error.details);

	// Checking if email is already in the database
	const emailExist = await User.findOne({ email: req.body.email });
	if (emailExist) return res.status(400).send("Email already exists");

	// Hashing the password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(req.body.password, salt);

	// Create a new user
	const user = new User({
		name: req.body.name,
		email: req.body.email,
		password: hashedPassword,
	});

	var rand = Math.floor(Math.random() * 100 + 54);
	var link = "https://" + req.get("host") + "/api/verify?id=" + rand;

	var mailOptions = {
		from: '"GrillStudy" <claude@grillstudy.com>',
		to: req.body.email,
		subject: "GrillStudy Email Verification",
		html:
			"Hello " +
			req.body.name +
			",<br> Please Click on the link to verify your email.<br><a href=" +
			link +
			">Click here to verify</a><br>From the GrillStudy Team<br>Helping university students become their best",
	};

	// Save the new user
	try {
		await user.save();
		transporter.sendMail(mailOptions, function (error, response) {
			if (error) {
				console.log(error);
				res.send("error");
			} else {
				console.log("Message sent: " + response.html);
				res.send("sent");
			}
		});
		res.send({ user: user._id });
	} catch (err) {
		res.status(400).send(err);
	}
});

// Verify login
router.post("/verify", function (req, res) {
	console.log(req.protocol + ":/" + req.get("host"));
	if (req.protocol + "://" + req.get("host") == "http://" + host) {
		console.log("Domain is matched. Information is from Authentic email");
		if (req.query.id == rand) {
			console.log("email is verified");
			res.end("<h1>Email " + mailOptions.to + " is been Successfully verified");
		} else {
			console.log("email is not verified");
			res.end("<h1>Bad Request</h1>");
		}
	} else {
		res.end("<h1>Request is from unknown source");
	}
});

// Login
router.post("/login", async (req, res) => {
	// Checking if email exists
	const user = await User.findOne({ email: req.body.email });
	if (!user) return res.status(400).send("Email is incorrect");
	// Checking if password matches db password
	const validPass = await bcrypt.compare(req.body.password, user.password);
	if (!validPass) return res.status(400).send("Password is incorrect");

	// Create and assign a token
	const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
	res.header("grillstudy-auth", token).send(token);
});

router.post("/verify", async (req, res) => {
	// Checking if token exists
	const token = req.header("grillstudy-auth");
	if (!token) return res.status(401).send("Access Denied");

	// Verify token is correct
	try {
		const verified = jwt.verify(token, process.env.TOKEN_SECRET);
		req.user = verified;
		next();
	} catch (err) {
		res.status(400).send("Invalid Token");
	}
});

module.exports = router;
