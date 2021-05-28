const router = require('express').Router();

const mysqlPool = require('../lib/mysqlPool');

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');

const validation = require('../lib/validation');
const { extractValidFields } = require('../lib/validation');
const { validateAgainstSchema } = require('../lib/validation');

exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};
/*
 * SELECT COUNT(*) FROM businesses;
 * getBusinessCount() gives us the number of businesses
 */

async function getBusinessesCount() {
    const [businessResults] = await mysqlPool.query(
        "SELECT COUNT(*) AS businessCount FROM businesses"
    ); //The promise returned by this resolves as an array
    console.log(" -- Business Count:", businessResults);
    return businessResults[0].businessCount;
}

/*
 * SELECT * FROM businesses ORDER BY id LIMIT <offset>, <pageSize>
 * Here we will get a page of businesses
 */

async function getBusinessesPage(page) {
    const businessCount = await getBusinessesCount();
    const pageSize = 2;
    const lastPage = Math.round(businessCount / pageSize);
    page = page > lastPage ? lastPage : page; //if the page value is greater than the last page, fetch the last page
    page = page < 1 ? 1 : page; //page cannot be less than 1, else set it to 1.
    const offset = (page - 1) * pageSize;
    //once we have the offset and page size, we can run the MySQL query
    /*
     * Be sure that these values are escaped. If we have values we want to plug into a query, use placeholders.
     * offset = "; DROP TABLES *;" Be wary of getting values directly from the user.
     */
    const [ businessResults ] = await mysqlPool.query(
        "SELECT * FROM businesses ORDER BY id LIMIT ?, ?",
        [offset, pageSize]  //offset and pageSize will be escaped and plugged into the question marks accordingly. Never plug stuff directly into the query, always escape
    );
    return {
        businesses: businessResults,
        page: page,
        totalPages: lastPage,
        pageSize: pageSize,
        numBusinesses: businessCount
    };
}


/*
 * Route to return a list of businesses. WORKING
 */
router.get('/', async (req, res) => {
    try { //execute the async call
        const businessesPage = await getBusinessesPage(
            parseInt(req.query.page) || 1 //if this value is not specified or does not parse as an integer, set the default page to 1.
        );
        res.status(200).send(businessesPage);
    }
    catch (err) {
        console.error(" -- error:", err);
        res.status(500).send({
            err: "Error fetching businesses page from DB. Try again later."
        });
    }
});

/*****************************POST**********************************/


async function insertNewBusiness(business) {
    business = extractValidFields(business, businessSchema);
    const [result] = await mysqlPool.query(
        "INSERT INTO businesses SET ?",
        business
    );
    return result.insertId;
}

exports.insertNewBusiness = insertNewBusiness;

/*
 * Route to create a new business. (WORKING)
 */
router.post('/', async (req, res, next) => {
    try {
        const id = await insertNewBusiness(req.body);
        if (id) {
            res.status(201).send({ id: id });
        }
        else {
            res.status(400).send({
                err: "Missing valid fields."
            });
        }
    }
    catch (err) {
        res.status(500).send({
            error: "Error inserting business into the database"
        });
    }
});


/*****************************GET**********************************/

/*
 * GET A SINGLE BUSINESS: SELECT * FROM businesses WHERE id = ? (businessID)
 */


async function getSingleBusiness(businessid) {
    const [businessResults] = await mysqlPool.query(
        "SELECT COUNT(*) AS businessCount FROM businesses WHERE id = ?",
        [businessid]
    ); 
    if (businessResults[0].businessCount > 0) {
        const [businessResults] = await mysqlPool.query(
            "SELECT * FROM businesses WHERE id = ?",
            [businessid]);
        const [reviewResults] = await mysqlPool.query(
            "SELECT * FROM reviews WHERE businessid = ?",
            [businessid]
        );
        const [photoResults] = await mysqlPool.query(
            "SELECT * FROM photos WHERE businessid = ?",
            [businessid]
        )
        const business = [
            businessResults,
            {
                reviews: reviewResults,
                photos: photoResults
            }
        ]
        return {
            business: business
        };
    }
}

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async (req, res, next) => {
    try { //execute the async call
        
        const singleBusiness = await getSingleBusiness(parseInt(req.params.businessid));
        //if the business id exists
        if (singleBusiness) {
            res.status(200).send(singleBusiness); //get OK
        }
        else {
            next();
        }
    }
    catch (err) {
        console.error(" -- error:", err);
        res.status(402).send({ //business id does not exist in the database 
            err: "Error fetching business from the database."
        });
    }
});



/*****************************PUT**********************************/

async function updateBusinessByID(businessid, business, ownerid) {
    const validatedBusiness = extractValidFields(
        business,
        businessSchema
    );
    console.log("ID: ", businessid, "ownerid: ", ownerid);
    const [result] = await mysqlPool.query(
        "UPDATE businesses SET ? WHERE id = ? AND ownerid = ?", //user cannot update the ownerid
        [validatedBusiness, businessid, ownerid]
    );
    return result.affectedRows > 0;
}

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', async (req, res, next) => {
    if (validateAgainstSchema(req.body, businessSchema)) { //if the info is valid against the schema, then we can try to update the business.
        try {
            const businessID = parseInt(req.params.businessid);
            const updateSucceeded = await updateBusinessByID(businessID, req.body, parseInt(req.body.ownerid)); //this successfully updates it
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
            err: "Request body does not contain a valid business (not allowed to update the owner id, must have all fields)"
        });
    }
});


/*****************************DELETE**********************************/

/*
 * DELETE SINGLE BUSINESS: DELETE * FROM businesses WHERE id = ? (businessID)
 */

async function deleteSingleBusiness(businessid) {
    const [businessResults] = await mysqlPool.query(
        "DELETE FROM businesses WHERE id = ?",
        [businessid],
        "DELETE FROM reviews WHERE businessid = ?",
        [businessid],
        "DELETE FROM photos WHERE businessid = ?",
        [businessid],
    );
    return businessResults.affectedRows > 0;
}

/*
 * Route to delete a business. (WORKING)
 */
router.delete('/:businessid', async (req, res, next) => {
    //FIX AND TEST
    try {
        const deleteSuccessful = await deleteSingleBusiness(parseInt(req.params.businessid));
        if (deleteSuccessful) {
            console.log("Business deleted: STATUS 204");
            res.status(204).end();
        }
        else {
            next();
        }
    }
    catch (err) {
        res.status(500).send({
            error: "Unable to delete business."
        });
    }
});
