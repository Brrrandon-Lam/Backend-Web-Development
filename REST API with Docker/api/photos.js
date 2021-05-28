const router = require('express').Router();
//const validation = require('../lib/validation');
const mysqlPool = require('../lib/mysqlPool');
const validation = require('../lib/validation');
const { validateAgainstSchema } = require('../lib/validation');
const { extractValidFields } = require('../lib/validation');

const photos = require('../data/photos');

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};

/*
 *  INSERT INTO photos SET ?
 */

async function getPhotoCount() {
    const [photoResults] = await mysqlPool.query(
        "SELECT COUNT(*) AS photoCount FROM photos"
    ); //The promise returned by this resolves as an array
    console.log(" -- Photo Count:", photoResults);
    return photoResults[0].photoCount;
}

async function insertNewPhoto(photo) {
    photo = extractValidFields(photo, photoSchema);
    const [result] = await mysqlPool.query(
        "INSERT INTO photos SET ?",
        photo
    );
    return result.insertId;
}

async function getPhotoCountSingle(photoid) {
    const [photoResults] = await mysqlPool.query(
        "SELECT COUNT(*) AS photoCount FROM photos WHERE id = ?",
        [photoid]
    ); //The promise returned by this resolves as an array
    console.log(" -- Photo Count:", photoResults);
    return photoResults[0].photoCount;
}

/*
 * Route to create a new photo.
 */
router.post('/', async (req, res, next) => {
    if (validation.validateAgainstSchema(req.body, photoSchema)) {
        try {
            const id = await insertNewPhoto(req.body);
            res.status(201).send({ id: id });
        }
        catch (err) {
            res.status(500).send({
                error: "Error inserting photo into the database"
            });
        }
    }
    else {
        res.status(400).json({
            error: "Request body is not a valid photo object"
        });
    }
});

/*
 * GET A SINGLE PHOTO: SELECT * FROM photos WHERE id = ? photoID)
 */

async function getSinglePhoto(photoID) {
    const [photoResults] = await mysqlPool.query(
        "SELECT * FROM photos WHERE id = ?", //id refers to the photo id
        [photoID]
    );
    return {
        photo: photoResults
    };
}
router.get('/:photoID', async (req, res, next) => {
    try { //execute the async call
        const photoCount = await getPhotoCountSingle(parseInt(req.params.photoID));
        console.log("photo count: ", photoCount);
        if (photoCount > 0) {
            const photoid = parseInt(req.params.photoID);
            const singlePhoto = await getSinglePhoto(parseInt(req.params.photoID));
            console.log(" -- Photo ID: ", photoid);
            if (singlePhoto) {
                res.status(200).send(singlePhoto); //get OK
            }
            else {
                next();
            }
        }
        else {
            next();
        }

    }
    catch (err) {
        console.error(" -- error:", err);
        res.status(402).send({ //photo id does not exist in the database 
            err: "Error fetching photo from the database."
        });
    }
});

/*
 * UPDATE photos SET ? where id = ?
 */

async function updatePhotoByID(photoID, photo, userid, businessid) {
    const validatedPhoto = extractValidFields(
        photo,
        photoSchema
    );
    const [result] = await mysqlPool.query(
        "UPDATE photos SET ? WHERE id = ? AND userid = ? AND businessid = ?",
        [validatedPhoto, photoID, userid, businessid]
    );
    return result.affectedRows > 0;
}

/*
 * Route to update a photo.
 */
router.put('/:photoID', async (req, res, next) => {
    const photoID = parseInt(req.params.photoID);
    if (validateAgainstSchema(req.body, photoSchema)) { //if the info is valid against the schema, then we can try to update the business.
        const userid = parseInt(req.body.userid);
        const businessid = parseInt(req.body.businessid);
        try {
            const updateSucceeded = await updatePhotoByID(photoID, req.body, userid, businessid); //this successfully updates it
            if (updateSucceeded) {
                res.status(200).send({});
            } else {
                next();
            }
        } catch (err) {
            res.status(500).send({});
        }
    } else {
        res.status(400).send({
            err: "Request body does not contain a valid photo"
        });
    }
});



/*
 * DELETE SINGLE PHOTO: DELETE * FROM photos WHERE id = ? (photoID)
 */

async function deleteSinglePhoto(photoID) {
    const [photoResults] = await mysqlPool.query(
        "DELETE FROM photos WHERE id = ?",
        [photoID]
    );
    return photoResults.affectedRows > 0;
}

/*
 * Route to delete a photo.
 */
router.delete('/:photoID', async (req, res, next) => {
    try {
        const deleteSuccessful = await deleteSinglePhoto(parseInt(req.params.photoID));
        if (deleteSuccessful) {
            res.status(204).end();
        }
        else {
            next();
        }
    }
    catch (err) {
        res.status(500).send({
            error: "Unable to delete photo."
        });
    }
});
