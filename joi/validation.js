// Validation
const Joi = require('@hapi/joi'); 
const joiPasswordComplex = require('joi-password-complexity');


// Register Validation
const registerValidation = (data) => {
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

    // Creating an array of errors
    return schema.validate(data);
};

module.exports.registerValidation = registerValidation;