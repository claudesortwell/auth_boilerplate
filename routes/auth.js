const router = require("express").Router();
const User = require("../model/User");
const { registerValidation } = require("../joi/validation");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");

// Reading HTML files
var readHTMLFile = function (path, callback) {
	fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
		if (err) {
			throw err;
			callback(err);
		} else {
			callback(null, html);
		}
	});
};

// Setting up Enviroment config file
dotenv.config();

// Nodemailer setup
var transporter = nodemailer.createTransport({
	pool: true,
	host: "ventraip.email",
	port: 465,
	sendMail: true,
	auth: {
		user: "info@grillstudy.com", // your domain email address
		pass: process.env.EMAIL_PASSWORD, // your password
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

// Register
router.post("/register", async (req, res) => {
	// Validating users register data
	const { error } = registerValidation(req.body);
	// If the submitted user details have a error return details of error and status 400
	if (error) return res.status(400).send(error.details);

	// Checking if email is already in the database
	const emailExist = await User.findOne({ email: req.body.email });
	if (emailExist) return res.status(400).send("Email already exists");

	const passwordMatch = req.body.password == req.body.passwordConfirm;
	if (!passwordMatch) return res.status(400).send("Password does not match");

	// Hashing the password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(req.body.password, salt);

	// Creating Random String
	var rand = await bcrypt.hash(req.body.email, salt);
	var link = "https://" + req.get("host") + "/api/user/emailverify?hash=" + rand + "&email=" + req.body.email;

	// Create a new user
	const user = new User({
		name: req.body.name,
		email: req.body.email,
		password: hashedPassword,
	});

	// Save the new user
	try {
		await user.save();
		readHTMLFile("./html/email.html", function (err, html) {
			// Handler bar replacing html items with user content
			var template = handlebars.compile(html);
			var replacements = {
				username: req.body.name,
				link: link,
			};
			var htmlToSend = template(replacements);

			// Email Options
			var mailOptions = {
				from: '"GrillStudy" <info@grillstudy.com>',
				to: req.body.email,
				subject: "GrillStudy Email Verification",
				html: htmlToSend,
			};

			// Sending Email
			transporter.sendMail(mailOptions, function (error) {
				if (error) {
					console.log(error);
					res.send("error");
				} else {
					console.log("Message sent");
					res.send("sent");
				}
			});
		});

		// Sending Back the user ID
		res.send({ user: user._id });
	} catch (err) {
		res.status(400).send(err);
	}
});

// Verify login
router.post("/emailverify", async (req, res) => {
	// Checking if hash and email exists
	if (req.query.hash && req.query.email) {
		const validHash = await bcrypt.compare(req.query.email, req.query.hash);
		if (validHash) {
			User.findOneAndUpdate({ email: req.query.email }, { $set: { emailCheck: true } }, function (err, doc) {
				if (err) {
					console.log("Error updating mongo for email verify");
				}

				res.sendStatus(200);
			});
		}
	} else {
		res.status(400).send("Invalid Link");
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
