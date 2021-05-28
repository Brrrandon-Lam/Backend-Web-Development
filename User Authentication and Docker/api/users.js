const router = require('express').Router();

const { getBusinessesByOwnerId } = require('../models/business');
const { getReviewsByUserId } = require('../models/review');
const { getPhotosByUserId } = require('../models/photo');

const { validateAgainstSchema } = require('../lib/validation');
const { generateAuthToken, requireAuthentication, optionalAuthentication } = require('../lib/auth');
const {
    UserSchema,
    insertNewUser,
    validateEmail,
    getAdminStatus,
    getEmail,
    getUserById,
    validateUserLogin
} = require('../models/user');

/*
 * So the user can log in.
 */

router.post('/login', async (req, res) => {
    if (req.body && req.body.email && req.body.password) {
        try {
            const authenticated = await validateUserLogin(req.body.email, req.body.password); //validates the user's login based on email and password
            if (authenticated) {
                //probably best to send this back to the user as a cookie in real implementation
                console.log("Authenticated, logging in.");
                res.status(200).send({
                    token: generateAuthToken(req.body.email) //generate a token with the email as the payload, send to the user.
                });
            }
            else {
                res.status(401).send({
                    error: "Authentication failure."
                });
            }
        }
        catch (err) {
            console.error(" -- Error: ", err);
            res.status(500).send({
                error: "Request body needs an 'id' and 'password'."
            });
        }
    }
    else {
        res.status(400).send({
            error: "Request body needs an 'id' and 'password'."
        });
    }
});

/*
 * Route to GET user by ID to return information about a specific user, excluding their password.
 */

router.get('/:id', requireAuthentication, async (req, res, next) => {
    try {
        const user = await getEmail(req.params.id);
        const admin = await getAdminStatus(req.email);
        console.log("req.email vs user email: ", req.email, user.email);
        if (req.email == user.email || admin == 1) { //if the user is an admin they can get this too
            const user2 = await getUserById(user.email, 0); //if the above information is valid, we can just fetch like this
            if (user2) {
                res.status(200).send(user2);
            }
            else {
                next();
            }
        }
        else {
            res.status(403).send({
                error: "Authentication failure"
            });
        }
    }
    catch (err) {
        console.error(" -- Error: ", err);
        res.status(500).send({
            error: "Error fetching user. Try again later."
        });
    }
});

/*
 * Route to post a new user into the database but only if the email is unique.
 */

router.post('/', optionalAuthentication, async (req, res) => {
    if (validateAgainstSchema(req.body, UserSchema)) { //validate the req.body against the user schema
        try {
            if (req.body.admin && req.body.admin == true) { //if the user specifies an admin field
                const admin = await getAdminStatus(req.email); //get the admin status of the existing user
                if (admin == 1) { //if the admin status is true then create the user 
                    const id = await insertNewUser(req.body); //insert the user into the database
                    console.log("Admin user created");
                    res.status(201).send({
                        _id: id
                    });
                }
                else {
                    res.status(401).send({
                        error: "Cannot create this user, not an admin."
                    });
                }
            }
            else {
                const id = await insertNewUser(req.body); //insert the user into the database
                if (id) {
                    console.log("Regular user created.");
                    res.status(201).send({ //success, return the ID to the user.
                        _id: id
                    });
                }
                else {
                    res.status(401).send({
                        error: "Cannot create user"
                    });
                }
            }
        }
        catch (err) { //serverside issue
            console.error(" -- Error: ", err);
            res.status(500).send({
                error: "Error inserting new user. Try again later."
            });
        }
    }
    else { //the contents inserted into the API do not follow the user schema
        res.status(400).send({
            error: "Request body does not contain a valid User."
        });
    }
});



/*
 * Route to list all of a user's businesses.
 */
router.get('/:id/businesses', requireAuthentication, async (req, res, next) => {
    try {
        const user = await getEmail(req.params.id);
        const admin = await getAdminStatus(req.email);
        console.log("Req.email: ", req.email);
        if (req.email == user.email || admin == 1) {
            const businesses = await getBusinessesByOwnerId(parseInt(req.params.id));
            if (businesses) {
                res.status(200).send({ businesses: businesses });
            } else {
                next();
            }
        }
        else {
            res.status(403).send({
                error: "Authentication failure"
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to fetch businesses.  Please try again later."
        });
    }
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:id/reviews', requireAuthentication, async (req, res, next) => {
    try {
        const user = await getEmail(req.params.id);
        const admin = await getAdminStatus(req.email);
        if (req.email == user.email || admin == 1) {
            const reviews = await getReviewsByUserId(parseInt(req.params.id));
            if (reviews) {
                res.status(200).send({ reviews: reviews });
            } else {
                next();
            }
        }
        else {
            res.status(403).send({
                error: "Authentication failure"
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to fetch reviews.  Please try again later."
        });
    }
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:id/photos', requireAuthentication, async (req, res, next) => {
    try {
        const user = await getEmail(req.params.id);
        const admin = await getAdminStatus(req.email);
        if (req.email == user.email || admin == 1) {
            const photos = await getPhotosByUserId(parseInt(req.params.id));
            if (photos) {
                res.status(200).send({ photos: photos });
            } else {
                next();
            }
        }
        else {
            res.status(403).send({
                error: "Authentication failure"
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to fetch photos.  Please try again later."
        });
    }
});

module.exports = router;
