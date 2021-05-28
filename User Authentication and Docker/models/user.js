const mysqlPool = require('../lib/mysqlPool');
const { extractValidFields } = require('../lib/validation');
const bcrypt = require('bcryptjs');

const UserSchema = {
    name: { required: true },
    email: { required: true },
    password: { required: true },
    admin: { required: false }
};
exports.UserSchema = UserSchema;

async function insertNewUser(user) {
    //extract the valid fields
    //select from the database
    console.log("user email: ", user.email);
    const [uniqueEmail] = await mysqlPool.query( 
        'SELECT COUNT(*) AS count FROM users WHERE email = ?',
        [ user.email ]
    );
    console.log("Number of users with this email already: ", uniqueEmail[0].count);
    if (uniqueEmail[0].count > 0) { //if uniqueEmail returns something then the user exists and we cannot create one with these credentials.
        console.log("User already exists!");
        return 0;
    }
    else { //extract the fields from the thing
        userToInsert = extractValidFields(user, UserSchema);
        console.log(" -- userToInsert before hashing: ", userToInsert); // DONT DO THIS :)
        userToInsert.password = await bcrypt.hash(userToInsert.password, 8);
        console.log(" -- userToInsert after hashing: ", userToInsert); // SERIOUSLY DONT DO THIS :):)
        const [result] = await mysqlPool.query(
            'INSERT INTO users SET ?',
            userToInsert
        );
        return result.insertId;
    }
}
exports.insertNewUser = insertNewUser;


//called by validateUserLogin
async function validateEmail(email) {
    //if there is a user then return it.
    const [user] = await mysqlPool.query(
        'SELECT COUNT(*) AS count FROM users WHERE email = ?',
        [ email ]
    ); //get the user contents from SQL given the id
    if (user[0].count <= 0) { //if theres nothing return 0
        return 0;
    }
    else { //if theres something then we can get the information accordingly.
        const [results] = await mysqlPool.query(
            'SELECT * FROM users WHERE email = ?',
            [ email ]
        );
        return results[0];
    }
}

exports.validateEmail = validateEmail;

async function getEmail(id) {
    const [results] = await mysqlPool.query(
        'SELECT * FROM users WHERE id = ?',
        [id]
    );
    return results[0];
}

exports.getEmail = getEmail;

//This function returns the email of the id passed.
async function getUserById(id, includePassword) {
    //get the email of the current id.
    const [existingEmail] = await mysqlPool.query(
        'SELECT COUNT(*) AS count FROM users WHERE email = ?',
        [id]
    );
    if (existingEmail[0].count > 0) {
        console.log("Email exists");
        if (includePassword) {
            console.log("Getting the user information");
            const [results] = await mysqlPool.query(
                'SELECT * FROM users WHERE email = ?',
                [id]
            );
            return results[0];
        }
        else {
            const [results] = await mysqlPool.query(
                'SELECT id, name, email, admin FROM users WHERE email = ?',
                [id]
            );
            return results[0];
        }
    }
    else {
        return 0;
    }
    

}

exports.getUserById = getUserById;

async function getAdminStatus(email) {
    const [results] = await mysqlPool.query(
        'SELECT COUNT(*) AS admin FROM users WHERE email = ? AND admin = true',
        [email]
    );
    console.log("User's Admin Status: ", results[0].admin);
    return results[0].admin;
}

exports.getAdminStatus = getAdminStatus;

exports.validateUserLogin = async function (email, password) {
    const user = await getUserById(email, true);
    const valid = await bcrypt.compare(password, user.password);
    console.log("Valid: ", valid);
    return user && valid;
    //return false if user is null. Otherwise, we will also compare using bcrypt.compare to validate.
}