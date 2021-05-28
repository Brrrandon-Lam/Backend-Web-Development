var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 8000;
app.use(bodyParser.json());
app.use(express.static('public'));

var businesses = require('./businesses');
var users = require('./users');

//This works. If it didn't I'd probably give up CS

app.get('/', function (req, res, next) {
    res.status(200).send("Landing page\n");
});

//helper function, creates user for extensive testing
app.post('/users', function (req, res, next) {
    console.log(" -- req.body:", req.body);
    if (req.body) {
        var id = users.length;
        users.push({ //push all components to the json
            username: req.body.username,
            businesses: req.body.businesses,
            reviews: req.body.reviews,
            photos: req.body.photos
        });
        res.status(201).send({ //render to page
            username: req.body.username,
            businesses: req.body.businesses,
            reviews: req.body.reviews,
            photos: req.body.photos,
            id: id
        });
    }
    else {
        res.status(400).send({
            err: "Missing username."
        });
    }
});

//Fully completed (test scripts done)

app.get('/businesses', function (req, res, next) {
    //need to finish writing pagination stuff
    //determine the length of the businesses
    var size = businesses.length; //fix this

    var page = parseInt(req.query.page) || 1; //if the user enters a page number, load it, or else load the first page if ambiguous
    var businessesPerPage = 2;
    var lastPage = Math.ceil(businesses.length / businessesPerPage);
    page = page < 1 ? 1 : page;
    page = page > lastPage ? lastPage : page;

    var start = (page - 1) * businessesPerPage;
    var end = start + businessesPerPage;
    var pageBusinesses = businesses.slice(start, end);

    var link = {};
    if (page < lastPage) {
        link.nextPage = '/businesses?page=' + (page + 1);
        link.lastPage = '/businesses?page=' + lastPage;
    }
    if (page > 1) {
        link.previousPage = '/businesses?page=' + (page - 1);
        link.firstPage = '/businesses?page=1';
    }

    res.status(200).send({
        businesses: pageBusinesses,
        pageNumber: page,
        totalPages: lastPage,
        pageSize: businessesPerPage,
        totalBusinesses: size, //THIS HAS NOT BEEN DECLARED YET.
        links: link
    });
    console.log(" -- Teleport Successful");
})

//Fully completed(test scripts done)
app.get('/businesses/:id', function (req, res, next) {
    console.log(" -- req.params:", req.params);
    var id = req.params.id;
    var owner = req.params.owner;
    if (businesses[id]) {
        res.status(200).send(businesses[id]);
    }
    else {
        next();
    }
});

//Fully complete (test scripts done)
app.post('/businesses', function (req, res, next) {
    console.log(" -- req.body:", req.body);
    if (req.body && req.body.owner && req.body.name && req.body.address && req.body.city && req.body.state && req.body.zipcode && req.body.phone && req.body.category && req.body.subcategory) { 
        var ownerID = 999;
        var ownerExists = false;
        for (var i = 0; i < users.length; i++) { //search list of users for an existing user
            if (users[i].username == req.body.owner) {
                ownerID = i;
                ownerExists = true;
                break;
            }
        }
        if (ownerExists) {
            var id = businesses.length;
            businesses.push({ //push all components to the json
                name: req.body.name,
                owner: req.body.owner,
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                zipcode: req.body.zipcode,
                phone: req.body.phone,
                category: req.body.category,
                subcategory: req.body.subcategory,
                website: req.body.website,
                email: req.body.email,
                photos: req.body.photos,
                reviews: req.body.reviews,
                links: req.body.links
            });
            users[ownerID].businesses.push({ //push to the owner's list of businesses
                businessName: req.body.name,
                businessLink: '/businesses/' + id
            });
            res.status(201).send({ //render to page
                id: id,
                businessID: id,
                owner: req.body.owner
            });
        }
        else {
            res.status(400).send({
                err: "Owner does not exist."
            });
        }
    }
    else {
        console.log("Entered else statement");
        res.status(400).send({
            err: "Missing information from JSON body. Required: Owner (Must be in list of users), Name, Address, City, State, Zip, Phone, Category, Subcategory"
        });
    }
});


//MODIFY BUSINESS (test scripts done)
app.put('/businesses/:id', function (req, res, next) {
    var id = req.params.id;
    console.log("-- req.params:", req.params);
    var isOwner = true;
    if (!(req.body.owner == businesses[id].owner)) {
        isOwner = false;
        res.status(400).send({
            err: "Cannot modify business as you are not the owner or format is invalid."
        });
    }
    if (businesses[id] && isOwner) {
        if (req.body && req.body.name && req.body.address && req.body.city && req.body.state && req.body.zipcode && req.body.phone && req.body.category && req.body.subcategory) {
            businesses[id] = req.body;
            res.status(200).send({
                businesses: '/businesses/' + id
            });
        }
    }
    else {
        if (isOwner === true) {
            res.status(400).send({
                err: "Request body missing some fields"
            });
        }
    }
});

//DELETE BUSINESS (WORKING)
app.delete('/businesses/:id', function (req, res, next) {
    console.log(" -- req.params:", req.params);
    var id = req.params.id; //get id from params
    if (businesses[id]) { //validate that business exists
        delete businesses[id]; //delete business
        res.status(204).end();
    }
    else {
        next();
    }
});

//Verifies that the infomration in the review is correct.
function validateReview(req) {
    if (req.body && req.body.author) { //does the review have an author
        if (req.body.stars >= 0 && req.body.stars <= 5) { //is the number of stars valid
            if (req.body.cost === "$" || req.body.cost === "$$" || req.body.cost === "$$$") { //does the const consist of one to three dollar signs
                return true;
            }
        }
    }
    else {
        return false;
    }
}

//ADD REVIEW TO BUSINESS (FULLY IMPLEMENTED)
app.post('/businesses/:id/reviews', function (req, res, next) {
    console.log(" -- req.body:", req.body);
    console.log(" -- req.params:", req.params);
    var businessID = req.params.id
    var numReviews = businesses[businessID].reviews.length;
    var numUsers = users.length;
    var i = 0;
    var j = 0;
    var userID = 999;
    var canWrite = true;
    var validAuthor = false;
    for (j = 0; j < numUsers; j++) { //first we validate that the user exists in the list of users.
        if (users[j].username == req.body.author) {
            console.log("Valid author found")
            validAuthor = true;
            userID = j;
            break;
        }
    }
    if (validAuthor == false) {
        res.status(400).send({
            err: "Review author does not exist in the list of valid users. Please create an account"
        });
    }
    for (i = 0; i < numReviews; i++) {
        if (businesses[businessID].reviews[i].author === req.body.author) { //if the user has already written a review then do not let them write another.
            canWrite = false;
            if (canWrite == false) {
                res.status(400).send({
                    err: "User already owns a review of this business."
                });
            }
            
        }
    }
    if (businesses[businessID] && validateReview(req) && canWrite && validAuthor) { //validate
        businesses[businessID].reviews.push({ //push to json
            author: req.body.author,
            stars: req.body.stars,
            cost: req.body.cost,
            writtenReview: req.body.writtenReview
        });
        const id = businesses[businessID].reviews.length;
        users[userID].reviews.push({
            businessName: businesses[businessID].name, //store the name for ease of access in modifying review later.
            author: req.body.author,
            stars: req.body.stars,
            cost: req.body.cost,
            writtenReview: req.body.writtenReview
        });
        const userReviewID = users[userID].reviews.length;
        res.status(201).send({
            businessReviewID: id,
            userReviewID: userReviewID,
            yourReviews: '/users/' + userID + '/reviews', //link back to the list of all of the user's written reviews
            businessInformation: '/businesses/' + businessID //link back to business
            
        })
    }
    else {
        if (canWrite === true && validAuthor == true) { //avoid double status error
            res.status(400).send({
                err: "Request body has invalid or missing information"
            });
        }
    }
});

//MODIFY REVIEW OF BUSINESS
//Must be updated on the business page
//Must be updated on the user's review page.
//A review should be editable on the business's page, similar to how a youtube comment is only editable from the video it is on, so we must acccess it this way.
app.put('/businesses/:businessID/reviews/:reviewID', function (req, res, next) {
    console.log(" --req.body:", req.body);
    console.log(" -- req.params:", req.params);
    var businessID = req.params.businessID;
    var reviewID = req.params.reviewID; 
    var userReviewID = 999;
    var userID = 999;
    var j = 0;
    var numUsers = users.length;
    //first validate that review exists
    console.log("Validating");
    if (businesses[businessID].reviews[reviewID]) {
        //if the review exists, find its author
        for (j = 0; j < numUsers; j++) {
            if (businesses[businessID].reviews[reviewID].author == users[j].username) {
                userID = j; //store the ID of the author
                break;
            }
        }
        var numReviews = users[userID].reviews.length;
        for (var k = 0; k < numReviews; k++) { //find the review number in users.json
            if (users[userID].reviews[k].businessName == businesses[businessID].name) {
                userReviewID = k;
                console.log("Updating information");
                break;
            }
        }
        //we know the review exists and we have found the author, so update the values based on req.body for both.
        businesses[businessID].reviews[reviewID].stars = req.body.stars,
        businesses[businessID].reviews[reviewID].cost = req.body.cost,
        businesses[businessID].reviews[reviewID].writtenReview = req.body.writtenReview,
        users[userID].reviews[userReviewID].stars = req.body.stars,
        users[userID].reviews[userReviewID].cost = req.body.cost,
        users[userID].reviews[userReviewID].writtenReview = req.body.writtenReview
        res.status(200).send({
            business: '/businesses/' + businessID,
            yourReview: '/users/' + userID + '/reviews'
        });

    }
    else {
        res.status(400).send({
            err: "Review does not exist. Cannot modify"
        });
    }
});

//DELETE REVIEW OF BUSINESS
app.delete('/businesses/:businessID/reviews/:reviewID', function (req, res, next) {
    var reviewID = req.params.reviewID;
    var businessID = req.params.businessID;
    var userLength = users.length;
    var userID = 999;
    var userReviewID = 999;
    console.log("Got here");
    //first verify the review exists
    if (businesses[businessID].reviews[reviewID]) {
        //we are given the review id and business id. find the review author.
        for (var i = 0; i < userLength; i++) {
            if (businesses[businessID].reviews[reviewID].author == users[i].username) {
                userID = i;
                console.log("Got here");
                break;
            }
        }
        //find the author in the author's list of reviews
        for (var j = 0; j < users[i].reviews.length; j++) {
            //iterate through the users review list and compare against the business review list to find the user review id (j).
            if (businesses[businessID].reviews[reviewID].image == users[userID].reviews[j].image) {
                userReviewID = j;
                console.log("Got here");
                break;
            }
        }
        delete businesses[businessID].reviews[reviewID]; //delete from business list
        delete users[userID].reviews[userReviewID]; //delete from user list.
        res.status(204).end();
        //all information found and return status
    }
    //once all information is gathered, delete
    else {
        next();
    }
   
});

//ADD PHOTO OF BUSINESS
/* First verify that the necessary information is entered
 * The only mandatory information is req.body.image and req.body.photographer
 * Other information: req.body.caption
 * Then verify that the user exists in the list of users
 * Then add the photo the business list of photos
 * Add the photo the user list of photos
 * Return a link to the business's detailed information
 * Return a link to the user's list of photos.
 */
app.post('/businesses/:businessID/photos', function (req, res, next) {
    console.log(" -- req.body:", req.body);
    var userExists = false;
    var businessID = req.params.businessID;
    var photographerID = 999;
    if (req.body && req.body.image && req.body.photographer) {
        for (var i = 0; i < users.length; i++) {
            if (req.body.photographer == users[i].username) { //compare the photographer against the list of users
                userExists = true;
                photographerID = i; //get the ID of the photographer and validate that the photographer is a user
                break;
            }
        }
        if (userExists) { //since the outer if statement validates that image and photographer exist, we can simply push the information into both places.
            users[photographerID].photos.push({
                photographer: req.body.photographer,
                image: req.body.image,
                caption: req.body.caption
            });
            businesses[businessID].photos.push({
                photographer: req.body.photographer,
                image: req.body.image,
                caption: req.body.caption
            });
            res.status(201).send({ //provide the user with links to the business page and to all of the photos they've uploaded.
                businessDetails: '/businesses/' + businessID,
                yourPhotos: '/users/' + photographerID + '/photos'
            });
        }
        else {
            res.status(400).send({
                err: "Invalid user"
            })
        }
    }
    else {
        res.status(400).send({
            err: "Invalid input. Please ensure that you have a photographer and image url."
        });

    }
});


//MODIFY CAPTION OF PHOTO OF BUSINESS
app.put('/businesses/:businessID/photos/:photoID', function (req, res, next) {
    console.log(" --req.body:", req.body);
    console.log(" -- req.params:", req.params);
    var businessID = req.params.businessID;
    var photoID = req.params.photoID;
    var userPhotoID = 999;
    var userID = 999;
    var j = 0;
    var numUsers = users.length;
    //first photo that review exists
    console.log("Validating");
    if (businesses[businessID].photos[photoID]) {
        if (businesses[businessID].photos[photoID].image == req.body.image && businesses[businessID].photos[photoID].photographer == req.body.photographer) {
            //if the photos exists, find its author
            for (j = 0; j < numUsers; j++) {
                if (businesses[businessID].photos[photoID].photographer == users[j].username) {
                    userID = j; //store the ID of the author
                    break;
                }
            }
            var numPhotos = users[userID].photos.length;
            for (var k = 0; k < numPhotos; k++) { //find the photo number in users.json
                if (users[userID].photos[k].image == businesses[businessID].photos[photoID].image) {
                    userPhotoID = k;
                    break;
                }
            }
            console.log("Updating information");
            //we know the photo exists and we have found the photographer, so update the values based on req.body for both.
            businesses[businessID].photos[photoID].caption = req.body.caption,
            users[userID].photos[userPhotoID].caption = req.body.caption
            res.status(200).send({
                business: '/businesses/' + businessID,
                yourPhoto: '/users/' + userID + '/photos'
            });
        }
        else {
            res.status(400).send({
                err: "Cannot modify the photographer or the image. Please delete and reupload instead."
            });
        }
    }
    else {
        res.status(400).send({
            err: "Photo does not exist. Cannot modify"
        });
    }
});

//REMOVE PHOTO OF BUSINESS (Fully Implemented)
app.delete('/businesses/:businessID/photos/:photoID', function (req, res, next) {
    var photoID = req.params.photoID;
    var businessID = req.params.businessID;
    var userLength = users.length;
    var userID = 999;
    var userPhotoID = 999;
    //first verify the photo exists
    if (businesses[businessID].photos[photoID]) {
        //we are given the photo id and business id. find the photographer.
        for (var i = 0; i < userLength; i++) {
            if (businesses[businessID].photos[photoID].photographer == users[i].username) {
                userID = i;
                break;
            }
        }
        //find the photograph in the photographer's list of photographs
        for (var j = 0; j < users[i].photos.length; j++) {
            //iterate through the users photo list and compare against the business photo list to find the user photo id (j).
            if (businesses[businessID].photos[photoID].image === users[userID].photos[j].image) {
                userPhotoID = j;
                break;
            }
        }
        delete businesses[businessID].photos[photoID]; //delete from business list
        delete users[userID].photos[userPhotoID]; //delete from user list.
        res.status(204).end();
        //all information found and return status
    }
    //once all information is gathered, delete
    else {
        next();
    }
});

//GET BUSINESSES OF USER
//Provides the name of the business and a link to the user's business.
app.get('/users/:userID/businesses', function (req, res, next) {
    console.log(" -- req.params:", req.params);
    var userID = req.params.userID;
    if (users[userID] && users[userID].businesses) {
        res.status(200).send({
            businesses: users[userID].businesses
        });
    }
    else {
        next();
    } 
});

//GET REVIEWS BY USER
app.get('/users/:userID/reviews', function (req, res, next) {
    console.log(" -- req.params:", req.params);
    var userID = req.params.userID;
    if (users[userID] && users[userID].reviews) {
        res.status(200).send({
            reviews: users[userID].reviews
        });
    }
    else {
        next();
    } 
    
});
//GET PHOTOS BY USER
app.get('/users/:userID/photos', function (req, res, next) {
    console.log(" -- req.params:", req.params);
    var userID = req.params.userID;
    if (users[userID] && users[userID].photos) {
        res.status(200).send({
            photos: users[userID].photos
        });
    }
    else {
        next();
    } 
});

app.use('*', function (req, res, next) {
    res.status(404).send({
        err: "Nothing to see here."
    });
});

app.listen(port, function () {
    console.log("== Server running on port", port);
});