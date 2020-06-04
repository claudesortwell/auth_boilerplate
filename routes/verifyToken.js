const jwt = require('jsonwebtoken');

function verify (req,res,next) {

    // Checking if token exists
    const token = req.header('grillstudy-auth');
    if(!token) return res.status(401).send('Access Denied');

    // Verify token is correct
    try {
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
}