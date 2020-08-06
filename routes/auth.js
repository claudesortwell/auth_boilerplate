const router = require("express").Router();
const User = require("../model/User");
const { registerValidation } = require("../joi/validation");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const crypto = require("crypto");
const fs = require("fs");

// Encryption Function
function encryptString(text) {
	let cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(process.env.PRIVATE_KEY), process.env.IV_ENCRYPT);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return encrypted.toString("hex");
}

// Reading HTML files function
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

// Verify Email SMTP Connection
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
	if (emailExist) return res.status(400).json({ message: "Email already exists" });

	// Checking Passwords Match
	const passwordMatch = req.body.password == req.body.passwordConfirm;
	if (!passwordMatch) return res.status(400).json({ message: "Password does not match" });

	// Encrypting the iLearn Password
	const encryptediLearnPass = encryptString(toString(req.body.universityDetails.ilearnPass));

	// Hashing the password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(req.body.password, salt);

	// Creating Random String
	var rand = await bcrypt.hash(req.body.email, salt);
	var link = "http://localhost:3001/emailverify?hash=" + rand + "&email=" + req.body.email;

	// Create a new user
	const user = new User({
		name: req.body.name,
		email: req.body.email,
		password: hashedPassword,
		universityDetails: { uniName: req.body.universityDetails.uniName, studentID: req.body.universityDetails.studentID, ilearnPass: encryptediLearnPass },
	});

	// Save the new user
	try {
		await user.save();
		readHTMLFile("./html/email.html", function (err, html) {
			if (err) {
				console.log(err);
				return;
			}
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
		res.status(400).json(err);
	}
});

// Verify Email
router.post("/emailverify", async (req, res) => {
	// Checking if hash and email exists
	if (req.body.hash && req.body.email) {
		const validHash = await bcrypt.compare(req.body.email, req.body.hash);
		if (validHash) {
			User.findOneAndUpdate({ email: req.body.email }, { $set: { emailCheck: true } }, function (err, doc) {
				if (err) {
					console.log("Error updating mongo for email verify");
				}

				res.status(200).json({ message: "Successfully verified account" });
			});
		}
	} else {
		res.status(400).json({ error: "Invalid Link" });
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
	const token = jwt.sign({ name: user.firstname, _id: user._id }, process.env.TOKEN_SECRET);
	res.header("auth-token", token).send(token);
});

module.exports = router;
