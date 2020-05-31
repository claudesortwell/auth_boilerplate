const router = require('express').Router();
const User = require('../model/User');

// Validation
const Joi = require('@hapi/joi'); 
const joiPasswordComplex = require('joi-password-complexity');

// joiPasswordComplex settings
const complexityOptions = {
    min: 8,
    max: 128,
    lowerCase: 1,
    upperCase: 1,
    numeric: 1,
    symbol: 1,
    requirementCount: 4,
};

const schema = Joi.object({
    name: Joi.string().min(2).required(),
    email: Joi.string().min(6).required().email(),
    password:  joiPasswordComplex(complexityOptions),
    passwordConfirm: Joi.ref('password')
});

router.post('/register', async (req, res) => {

    // Validating the data before creating user
    const validation = schema.validate(req.body);

    res.send(validation);

    // const user = new User({
    //     name: req.body.name,
    //     email: req.body.email,
    //     password: req.body.password
    // });

    // try {
    //     const savedUser = await user.save();
    //     res.send(savedUser); 
    // } catch(err) {
    //     res.status(400).send(err);
    // }
})

module.exports = router;