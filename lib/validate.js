const getTypeOf = require("./getTypeOf");
const filter = require("./utils/filter");


function getJsonSchemaType(value, expectedType) {
    let jsType = getTypeOf(value);
    if (jsType === "number" && expectedType === "integer") {
        const x = parseFloat(value);
        jsType = (x | 0) === x ? "integer" : "number"; // eslint-disable-line no-bitwise
    }
    return jsType;
}


/**
 * Validate data by a json schema
 *
 * @param  {CoreInterface} core - validator
 * @param  {Schema} schema      - json schema
 * @param  {Mixed} value        - value to validate
 * @param  {String} [pointer]   - json pointer pointing to value
 * @return {Array} list of errors or empty
 */
module.exports = function validate(core, schema, value, pointer = "#") {
    const receivedType = getJsonSchemaType(value, schema.type);
    const expectedType = schema.type || receivedType;

    if (receivedType !== expectedType) {
        return [core.errors.typeError({ received: receivedType, expected: expectedType, pointer })];
    }
    if (core.validateType[receivedType] == null) {
        return [core.errors.invalidTypeError({ receivedType, pointer })];
    }

    return core.validateType[receivedType](core, schema, value, pointer).filter(filter.errorsOnly);
};
