const getTypeOf = require("./getTypeOf");
const typeValidation = require("./validation/type");


/**
 * Test if the data is valid according to the given schema
 *
 * @param  {Mixed} data     - data to validate
 * @param  {Schema} schema  - json schema
 * @param  {Schema} root  - root json schema
 * @return {Mixed|false} the json schema or false if schema does not match data
 */
function isValid(data, schema, step, root = schema) {
    if (typeof step !== "function") {
        throw new Error("Expected step to be a function. Got: " + (typeof step));
    }
    return typeValidation.validate(schema, data, step, root);
}


module.exports = isValid;
