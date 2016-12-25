const getTypeOf = require("./getTypeOf");


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
    let receivedType = getTypeOf(value);
    const expectedType = schema.type || receivedType;

    if (expectedType === "integer" && receivedType === "number") {
        const x = parseFloat(value);
        receivedType = (x | 0) === x ? "integer" : receivedType; // eslint-disable-line no-bitwise
    }
    if (receivedType !== expectedType) {
        return [new core.errors.TypeError({ received: receivedType, expected: expectedType, pointer })];
    }
    if (core.validateType[receivedType] == null) {
        return [new core.errors.InvalidTypeError({ receivedType, pointer })];
    }
    return core.validateType[receivedType](core, schema, value, pointer);
};
