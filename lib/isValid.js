const container = ["array", "object"];
const getTypeOf = require("./getTypeOf");


/**
 * Test if the data is valid according to the given schema
 *
 * @param  {Mixed} data     - data to validate
 * @param  {Schema} schema  - json schema
 * @return {Mixed|false} the json schema or false if schema does not match data
 */
function isValid(data, schema) {
    if (container.indexOf(schema.type) === -1) {
        return matchValue(schema, data);
    }
    if (schema.type === "object") {
        return matchObject(schema, data);
    }
    return schema;
}


function matchObject(schema, data) {
    const keys = Object.keys(schema.properties);
    // schema properties in data ?
    for (var i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (data[key] === undefined || isValid(data[key], schema.properties[key]) === false) {
            return false;
        }
    }
    return schema;
}


function matchValue(schema, data) {
    if (getTypeOf(data) !== schema.type) {
        return false;
    }
    if (schema.pattern) {
        const pattern = new RegExp(schema.pattern);
        if (pattern.test(data) === false) {
            return false;
        }
    }
    return schema;
}


module.exports = isValid;

