const router = require('express').Router();
exports.router = router;

const { businesses } = require('./businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');
const { extractValidFields } = require('../lib/validation');
const { validateAgainstSchema } = require('../lib/validation');
const mysqlPool = require('../lib/mysqlPool');


/*
 * Route to list all of a user's businesses.
 * SELECT * FROM businesses WHERE ownerid = ?
 * ownerid==userid
 */

async function getBusinessesByUser(userid) {
    const [businessResults] = await mysqlPool.query(
        "SELECT * FROM businesses WHERE ownerid = ? ORDER BY id",
        [userid]
    );
    return {
        your_businesses: businessResults,
    };
}

async function getReviewsByUser(userid) {
    const [reviewResults] = await mysqlPool.query(
        "SELECT * FROM reviews WHERE userid = ? ORDER BY id",
        [userid]
    );
    return {
        your_reviews: reviewResults,
    };
}

async function getPhotosByUser(userid) {
    const [photoResults] = await mysqlPool.query(
        "SELECT * FROM reviews WHERE userid = ? ORDER BY id",
        [userid]
    );
    return {
        your_photos: photoResults,
    };
}

async function checkBusinesses(userid) {
    const [userResults] = await mysqlPool.query(
        "SELECT COUNT(*) AS businessCount FROM businesses WHERE ownerid = ?",
        [userid]
    );
    if (userResults[0].businessCount > 0) {
        return userResults[0].businessCount > 0;
    }
    else {
        return userResults[0].businessCount = 0;
    }
}

async function checkReviews(userid) {
    const [userResults] = await mysqlPool.query(
        "SELECT COUNT(*) AS reviewCount FROM reviews WHERE userid = ?",
        [userid]
    );
    if (userResults[0].reviewCount > 0) {
        return userResults[0].reviewCount > 0;
    }
    else {
        return userResults[0].reviewCount = 0;
    }
}
async function checkPhotos(userid) {
    const [userResults] = await mysqlPool.query(
        "SELECT COUNT(*) AS photoCount FROM photos WHERE userid = ?",
        [userid]
    );
    if (userResults[0].photoCount > 0) {
        return userResults[0].photoCount > 0;
    }
    else {
        return userResults[0].photoCount = 0;
    }
}

router.get('/:userid/businesses', async (req, res) =>{
  const userid = parseInt(req.params.userid);
    try {
        const userOwnsBusiness = await checkBusinesses(userid);
        if (userOwnsBusiness) {
            const businessList = await getBusinessesByUser(userid);
            res.status(200).send(businessList);
        }
        else {
            res.status(400).send({
                err: "User does not own any businesses"
            });
        }
    }
    catch (err) {
        console.error(" -- error:", err);
        res.status(500).send({
            err: "Error fetching businesses page from DB. Try again later."
        });
    }
});

/*
 * Route to list all of a user's reviews.
 */
router.get('/:userid/reviews', async (req, res) => {
    const userid = parseInt(req.params.userid);
    try {
        const userOwnsReview = await checkReviews(userid);
        if (userOwnsReview) {
            const reviewList = await getReviewsByUser(userid);
            res.status(200).send(reviewList);
        }
        else {
            res.status(400).send({
                err: "User does not own any reviews"
            });
        }
    }
    catch (err) {
        console.error(" -- error:", err);
        res.status(500).send({
            err: "Error fetching review page from DB. Try again later."
        });
    }
});

/*
 * Route to list all of a user's photos.
 */
router.get('/:userid/photos', async (req, res) => {
    const userid = parseInt(req.params.userid);
    try {
        const userOwnsPhoto = await checkPhotos(userid);
        if (userOwnsPhoto) {
            const photoList = await getPhotosByUser(userid);
            res.status(200).send(photoList);
        }
        else {
            res.status(400).send({
                err: "User does not own any photos"
            });
        }
    }
    catch (err) {
        console.error(" -- error:", err);
        res.status(500).send({
            err: "Error fetching photos page from DB. Try again later."
        });
    }
});
