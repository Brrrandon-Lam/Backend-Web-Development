/*
 * API sub-router for businesses collection endpoints.
 */

const router = require('express').Router();
const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { getEmail, getAdminStatus } = require('../models/user');

const { validateAgainstSchema } = require('../lib/validation');
const {
  ReviewSchema,
  hasUserReviewedBusiness,
  insertNewReview,
  getReviewById,
  replaceReviewById,
  deleteReviewById,
  getReviewOwner
} = require('../models/review');

/*
 * Route to create a new review.
 */
router.post('/', requireAuthentication, async (req, res) => {
    if (validateAgainstSchema(req.body, ReviewSchema)) {
        try {
            const user = await getEmail(req.body.userid);//get user information from the body
            const admin = await getAdminStatus(req.email);
            if (req.email == user.email || admin == 1) { //if the user's token information matches the index access or the user is an admin then perform the POST.
                /*
                 * Make sure the user is not trying to review the same business twice.
                 * If they're not, then insert their review into the DB.
                 */
                const alreadyReviewed = await hasUserReviewedBusiness(req.body.userid, req.body.businessid);
                if (alreadyReviewed) {
                    res.status(403).send({
                        error: "User has already posted a review of this business"
                    });
                }
                else {
                    const id = await insertNewReview(req.body);
                    res.status(201).send({
                        id: id,
                        links: {
                            review: `/reviews/${id}`,
                            business: `/businesses/${req.body.businessid}`
                        }
                    });
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
                error: "Error inserting review into DB.  Please try again later."
            });
        }
    }
    else {
        res.status(400).send({
            error: "Request body is not a valid review object."
        });
    }
});

/*
 * Route to fetch info about a specific review.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const review = await getReviewById(parseInt(req.params.id));
    if (review) {
      res.status(200).send(review);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch review.  Please try again later."
    });
  }
});

/*
 * Route to update a review.
 */
router.put('/:id', requireAuthentication, async (req, res, next) => {
    if (validateAgainstSchema(req.body, ReviewSchema)) {
        try {
            /*
             * Make sure the updated review has the same businessID and userID as
             * the existing review.  If it doesn't, respond with a 403 error.  If the
             * review doesn't already exist, respond with a 404 error.
             */
            const user = await getEmail(req.body.userid);//get user information from the body
            const admin = await getAdminStatus(req.email); //get the admin status of the user from req.email
            if (req.email == user.email || admin == 1) { //checking credentials are the outermost layer of the try block. If they are valid then:
                const id = parseInt(req.params.id); //get the id
                const existingReview = await getReviewById(id); //check if the review exists
                if (existingReview) { //do the stuff
                    if (req.body.businessid === existingReview.businessid && req.body.userid === existingReview.userid) {
                        const updateSuccessful = await replaceReviewById(id, req.body);
                        if (updateSuccessful) {
                            res.status(200).send({
                                links: {
                                    business: `/businesses/${req.body.businessid}`,
                                    review: `/reviews/${id}`
                                }
                            });
                        }
                        else {
                            next();
                        }
                    }
                    else {
                        res.status(403).send({
                            error: "Discrepancy in the information required to perform this action"
                        });
                    }
                }
                else {
                    next();
                }
            }
            else { //else bad credentials
                res.status(401).send({
                    error: "Authentication failure."
                });
            }
        }
        catch (err) {
            console.error(err);
            res.status(500).send({
                error: "Unable to update review.  Please try again later."
            });
        }
    }
    else {
        res.status(400).send({
            error: "Request body is not a valid review object."
        });
    }
});

/*
 * Route to delete a review.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
    try {
        const reviewOwner = await getReviewOwner(parseInt(req.params.id)); //get the business owner's id
        console.log("reviewOwner ID: ", reviewOwner);
        const user = await getEmail(reviewOwner);//get user information from the body
        const admin = await getAdminStatus(req.email); //get the admin status of the user from req.email
        if (req.email == user.email || admin == 1) { //good credentials if this passes
            const deleteSuccessful = await deleteReviewById(parseInt(req.params.id));
            if (deleteSuccessful) {
                res.status(204).end();
            } else {
                next();
            }
        }
        else { //else bad credentials
            res.status(401).send({
                error: "Authentication failure."
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to delete review.  Please try again later."
        });
    }
});

module.exports = router;
