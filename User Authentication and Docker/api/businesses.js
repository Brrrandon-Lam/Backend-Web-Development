/*
 * API sub-router for businesses collection endpoints.
 */

const router = require('express').Router();

const { generateAuthToken, requireAuthentication } = require('../lib/auth');
const { validateAgainstSchema } = require('../lib/validation');
const {
  BusinessSchema,
  getBusinessesPage,
  insertNewBusiness,
  getBusinessDetailsById,
  replaceBusinessById,
  deleteBusinessById,
  getBusinessesByOwnerId,
  getBusinessOwner
} = require('../models/business');

const { getEmail, getAdminStatus } = require('../models/user');

/*
 * Route to return a paginated list of businesses.
 */
router.get('/', async (req, res) => {
  try {
    /*
     * Fetch page info, generate HATEOAS links for surrounding pages and then
     * send response.
     */
    const businessPage = await getBusinessesPage(parseInt(req.query.page) || 1);
    businessPage.links = {};
    if (businessPage.page < businessPage.totalPages) {
      businessPage.links.nextPage = `/businesses?page=${businessPage.page + 1}`;
      businessPage.links.lastPage = `/businesses?page=${businessPage.totalPages}`;
    }
    if (businessPage.page > 1) {
      businessPage.links.prevPage = `/businesses?page=${businessPage.page - 1}`;
      businessPage.links.firstPage = '/businesses?page=1';
    }
    res.status(200).send(businessPage);
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Error fetching businesses list.  Please try again later."
    });
  }
});

/*
 * Route to create a new business.
 */
router.post('/', requireAuthentication, async (req, res) => {
    if (validateAgainstSchema(req.body, BusinessSchema)) {
        try {
            const user = await getEmail(req.body.ownerid);//get user information from the body
            const admin = await getAdminStatus(req.email);
            console.log("The user is an admin in BUSINESS POST: ", admin);
            if (req.email == user.email || admin == 1) { //if the user's token information matches the index access or the user is an admin then perform the POST.
                const id = await insertNewBusiness(req.body);
                res.status(201).send({
                    id: id,
                    links: {
                        business: `/businesses/${id}`
                    }
                });
            }
            else {
                res.status(403).send({
                    error: "Authentication error."
                });
            }
        }
        catch (err) {
            console.error(err);
            res.status(500).send({
                error: "Error inserting business into DB.  Please try again later."
            });
        }
    }
    else {
        res.status(400).send({
            error: "Request body is not a valid business object."
        });
    }
});

/*
 * Route to fetch info about a specific business.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const business = await getBusinessDetailsById(parseInt(req.params.id));
    if (business) {
      res.status(200).send(business);
    }
    else {
      next();
    }
  } catch (err) {
    console.error(err);
    res.status(500).send({
      error: "Unable to fetch business.  Please try again later."
    });
  }
});

/*
 * Route to replace data for a business.
 */
router.put('/:id', requireAuthentication, async (req, res, next) => {
    if (validateAgainstSchema(req.body, BusinessSchema)) { //validate against the schema
        try {
            const user = await getEmail(req.body.ownerid);//get user information from the body
            const admin = await getAdminStatus(req.email); //get the admin status of the user from req.email
            if (req.email == user.email || admin == 1) { //if the token matches or the token belongs to an admin, perform the action
                const id = parseInt(req.params.id)
                const updateSuccessful = await replaceBusinessById(id, req.body);
                if (updateSuccessful) {
                    res.status(200).send({
                        links: {
                            business: `/businesses/${id}`
                        }
                    });
                } else {
                    next();
                }
            }
            else { //else we know the credentials are bad
                res.status(401).send({
                    error: "Authentication failure."
                });
            }
        }
        catch (err) {
            console.error(err);
            res.status(500).send({
                error: "Unable to update specified business.  Please try again later."
            });
        }
    }
    else {
        res.status(400).send({
            error: "Request body is not a valid business object"
        });
    }
});

/*
 * Route to delete a business.
 */
router.delete('/:id', requireAuthentication, async (req, res, next) => {
    try {
        const businessOwner = await getBusinessOwner(parseInt(req.params.id)); //get the business owner's id
        console.log("Business owner ID: ", businessOwner);
        const user = await getEmail(businessOwner);//get the user email from the business owner id
        const admin = await getAdminStatus(req.email); //get the admin status of the user from req.email
        if (req.email == user.email || admin == 1) { //if admin or if valid user token perform delete
            const deleteSuccessful = await deleteBusinessById(parseInt(req.params.id));
            if (deleteSuccessful) {+
                res.status(204).end();
            } else {
                next();
            }
        }
        else { //if credentials bad, tell the user.
            res.status(401).send({
                error: "Authentication failure."
            });
        }
    }
    catch (err) {
        console.error(err);
        res.status(500).send({
            error: "Unable to delete business.  Please try again later."
        });
    }
    
});

module.exports = router;
