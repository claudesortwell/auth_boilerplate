const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			max: 255,
			min: 1,
		},
		email: {
			type: String,
			required: true,
			max: 255,
		},
		emailCheck: {
			type: Boolean,
			default: false,
		},
		password: {
			type: String,
			required: true,
			max: 1024,
			min: 6,
		},
		universityDetails: { type: Object, default: ["uniName", "studentID", "ilearnPass"] },
		subjects: { type: Array, default: [null] },
		files: { type: Array, default: [null] },
		flashCards: { type: Array, default: [null] },
		reminders: { type: Array, default: [null] },
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("users", userSchema, "users");
