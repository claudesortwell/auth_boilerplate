const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
        default: false
    },
    password: {
        type: String,
        required: true, 
        max: 1024,
        min: 6
    }
},
{
    timestamps: true
})

module.exports = mongoose.model('User', userSchema)