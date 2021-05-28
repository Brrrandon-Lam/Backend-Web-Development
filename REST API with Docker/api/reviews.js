const router = require('express').Router();
//const validation = require('../lib/validation');
const mysqlPool = require('../lib/mysqlPool');
const validation = require('../lib/validation');
const { extractValidFields } = require('../lib/validation');
const reviews = require('../data/reviews');
const { validateAgainstSchema } = require('../lib/validation');
exports.router = router;
exports.reviews = reviews;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};

async function getReviewCount() {
    const [reviewResults] = await mysqlPool.query(
        "SELECT COUNT(*) AS reviewCount FROM reviews"
    ); //The promise returned by this resolves as an array
    console.log(" -- Review Count:", reviewResults);
    return reviewResults[0].reviewCount;
}

async function insertNewReview(review) {
    review = extractValidFields(review, reviewSchema);
    const [result] = await mysqlPool.query(
        "INSERT INTO reviews SET ?",
        review
    );
    return result.insertId;
}

async function updateReviewByID(review, reviewId, userid, businessid) {
    const validatedReview = extractValidFields(
        review,
        reviewSchema
    );
    const [reviewResults] = await mysqlPool.query(
        "UPDATE reviews SET ? WHERE id = ? AND userid = ? AND businessid = ?",
        [validatedReview, reviewId, userid, businessid]
    );
    return reviewResults.affectedRows > 0;
}

async function checkForDuplicates(businessid, userid) {
    const [duplicateCheck] = await mysqlPool.query(
        "SELECT count(*) AS reviewCount FROM reviews WHERE businessid = ? AND userid = ?",
        [businessid, userid]
    )
    console.log("Review Count: ", duplicateCheck[0].reviewCount);
    if (duplicateCheck[0].reviewCount == 0) {
        return duplicateCheck[0].reviewCount = 0;
    }
    else {
        return duplicateCheck[0].reviewCount > 1;
    }
}

/*
 * Route to create a new review.
 */
router.post('/', async (req, res, next) => {

    if (validation.validateAgainstSchema(req.body, reviewSchema)) {

        try {
            const validReview = await checkForDuplicates(parseInt(req.body.businessid), parseInt(req.body.userid));
            console.log("Checking review done");
            if (validReview > 0) {
                console.log("User with id ", req.body.userid, " has already posted a review for business with id ", req.body.businessid);
                res.status(400).send({
                    error: "Already written review!"
                })
            }
            else {
                const id = await insertNewReview(req.body);
                res.status(201).send({ id: id });
            }
        }
        catch (err) {
            res.status(500).send({
                error: "Error inserting review into the database"
            });
        }
    }
    else {
        res.status(400).json({
            error: "Request body is not a valid review object"
        });
    }
});

/*
 * GET A SINGLE REVIEW: SELECT * FROM reviews WHERE id = ? reviewID)
 */

async function getSingleReview(reviewID) {
    const [validIndex] = await mysqlPool.query(
        "SELECT COUNT(*) AS reviewCount FROM reviews WHERE id = ?",
        [reviewID]
    );
    if (validIndex[0].reviewCount > 0) { //if we find a review then the index is valid
        const [reviewResults] = await mysqlPool.query(
            "SELECT * FROM reviews WHERE id = ?", //id refers to the review id
            [reviewID]
        );
        return {
            review: reviewResults
        };
    }
}

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async (req, res, next) => {
    try { //execute the async call
        const reviewid = parseInt(req.params.reviewID);
        const singleReview = await getSingleReview(parseInt(req.params.reviewID));
        console.log(" -- Review ID: ", reviewid);
        if (singleReview) {
            res.status(200).send(singleReview); //get OK
        }
        else {
            next();
        }

    }
    catch (err) {
        console.error(" -- error:", err);
        res.status(402).send({ //review id does not exist in the database 
            err: "Review does not exist in the database"
        });
    }
});

/*
 * Route to update a review.
 */
router.put('/:reviewID', async (req, res, next) => {

    if (validateAgainstSchema(req.body, reviewSchema)) { //if the info is valid against the schema, then we can try to update the business.
        try {
            console.log(parseInt(req.params.reviewID), parseInt(req.body.userid), parseInt(req.body.businessid));
            const updateSucceeded = await updateReviewByID(req.body, parseInt(req.params.reviewID), parseInt(req.body.userid), parseInt(req.body.businessid)); //this successfully updates it
            if (updateSucceeded) {
                res.status(200).send({});
            } else {
                next();
            }

        } catch (err) {
            res.status(500).send({
                err: "Failed to update in database"
            });
        }
    } else {
        res.status(400).send({
            err: "Request body does not contain a valid review"
        });
    }
});

async function deleteSingleReview(reviewID) {
    const [reviewResults] = await mysqlPool.query(
        "DELETE FROM reviews WHERE id = ?",
        [reviewID]
    );
    return reviewResults.affectedRows > 0;
}

/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async (req, res, next) => {
    try {
        const deleteSuccessful = await deleteSingleReview(parseInt(req.params.reviewID));
        if (deleteSuccessful) {
            res.status(204).end();
        }
        else {
            next();
        }
    }
    catch (err) {
        res.status(500).send({
            error: "Unable to delete review."
        });
    }
});
