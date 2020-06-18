const router = require('express').Router();
const User = require('../model/User');
const { registerValidation } = require('../joi/validation');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Register
router.post('/register', async (req, res) => {
    // Validating users register data
    const { error } = registerValidation(req.body);
    // If the submitted user details have a error return details of error and status 400
    if(error) return res.status(400).send(error.details);

    // Checking if email is already in the database
    const emailExist = await User.findOne({email: req.body.email});
    if(emailExist) return res.status(400).send('Email already exists')
    
    // Hashing the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Create a new user
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });

    // Save the new user
    try {
        await user.save();
        res.send({user: user._id}); 
    } catch(err) {
        res.status(400).send(err);
    }
})

// Login
router.post('/login', async (req, res) => {
    // Checking if email exists
    const user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).send('Email is incorrect');
    // Checking if password matches db password
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('Password is incorrect');

    // Create and assign a token
    const token = jwt.sign({_id: user._id}, process.env.TOKEN_SECRET);
    res.header('grillstudy-auth', token).send(token);
})

module.exports = router;