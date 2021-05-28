const jwt = require('jsonwebtoken');

const secretKey = "SuperSecret"; //secret key, used to sign and verify JWTs. (Bad practice)

function generateAuthToken(userEmail) { 
    const payload = { sub: userEmail };
    return jwt.sign(payload, secretKey, { expiresIn: '24h' });
}
exports.generateAuthToken = generateAuthToken;

function requireAuthentication(req, res, next) {
    console.log("  -- verifying authentication");
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    console.log("  -- authHeaderParts:", authHeaderParts);
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

    try {
        const payload = jwt.verify(token, secretKey);
        req.email = payload.sub;
        next();
    } catch (err) {
        res.status(401).send({
            error: "Invalid authentication token."
        });
    }
}
exports.requireAuthentication = requireAuthentication;


function optionalAuthentication(req, res, next) {
    console.log(" -- verifying authentication");
    const authHeader = req.get('Authorization') || '';
    const authHeaderParts = authHeader.split(' ');
    console.log(" -- authHeaderParts:", authHeaderParts);
    const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;
    try {
        const payload = jwt.verify(token, secretKey);
        req.email = payload.sub;
        next();
    }
    catch (err) {
        console.log("User is not logged in. Cannot create an admin for sure");
        next();
    }
}

exports.optionalAuthentication = optionalAuthentication;