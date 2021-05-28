/*
 * API sub-router for businesses collection endpoints.
 */

const router = require('express').Router();
const multer = require('multer'); //enables the usage of multer in our API
const crypto = require('crypto'); //generate string of random bytes using this cryptography library.

const { validateAgainstSchema } = require('../lib/validation');
const {
  PhotoSchema,
  insertNewPhoto,
  getPhotoById
} = require('../models/photo');

const acceptedFileTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

/*
const upload = multer({
    dest: `${__dirname}/uploads`
});
*/


//in regards to the assignment, this allows us to store a photo in the POST /photos assuming the type is jpg or PNG.
//we will use this to control how, where and what kinds of files are stored.
const upload = multer({
    //pass the file name into the callback
    //pass the file and the request information
    //note: the file size is included in what we pass into file
    //callback is provided to us bby multer. If we call callback it will send the filename back to multer.
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const filename = crypto.pseudoRandomBytes(16).toString('hex');
            const extension = acceptedFileTypes[file.mimetype];
            callback(null, `${filename}.${extension}`);
        },
    }),
    //filefilter is an option to multer, it does not inside the disk storage, but alongside the disk storage.
    fileFilter: (req, file, callback) => {
        //pass false into the call back or true depending on whether the file is or is not accepted
        callback(null, !!acceptedFileTypes[file.mimetype]) //this is a javascript trick to take a value and coerce it into a boolean value
        //if the mimetype is in the acceptedFileTypes, it will return true. Else return false. Without !! this would be the 
        //extension. With only one ! it would be truthy (extension) or falsey (undefined), so the second ! allows us to coerce
        //the truthy or falsey value into being a boolean.
        //truthy to false to true
    }
});


/*
app.get('/', (req, res, next) => {
    console.log(" == req.body: ");
    console.log(" == req.file");
    res.status(200).sendFile(__dirname + '/index.html');
});
*/

/*
 * Route to post a photo to the database.
 * Should expect a jpeg or PNG image as well as businessid and caption (optional)
 */

app.post('/photos', upload.single('image'), (req, res, next) => {
    console.log(" == req.body: ");
    console.log(" == req.file");
    res.status(200).send();
});

//this will handle any errors thrown by functions above it.
app.use('*', (err, req, res, next) => {
    console.error(err);
    res.status(500).send({
        error: "An error occurred. Try again later."
    })
});

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const photo = await getPhotoById(req.params.id);
    if (photo) {
      res.status(200).send(photo);
    } else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch photo.  Please try again later."
    });
  }
});

module.exports = router;
