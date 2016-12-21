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
function isValid(data, schema, root = schema) {
    const type = getTypeOf(data);
    if (type !== schema.type) {
        return false;
    }
    if (typeValidation[type] == null) {
        return false;
    }
    return typeValidation[type](schema, data, root, isValid);
}


module.exports = isValid;
