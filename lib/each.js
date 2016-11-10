const getTypeOf = require("./getTypeOf");
const step = require("./step");


/**
 * Iterates over data, retrieving its schema
 *
 * @param  {Mixed} data         - the data to iterate
 * @param  {Object} schema      - the schema matching the data
 * @param  {Function} callback  - will be called with (data, schema) on each item
 */
function each(data, schema, callback, pointer = "#") {
    callback(schema, data, pointer);

    if (getTypeOf(data) === "object") {
        Object.keys(data).forEach((key) => {
            const nextSchema = step(key, schema, data); // not save
            const next = data[key]; // save
            each(next, nextSchema, callback, `${pointer}/${key}`);
        });
    } else if (getTypeOf(data) === "array") {
        data.forEach((next, key) => {
            const nextSchema = step(key, schema, data);
            each(next, nextSchema, callback, `${pointer}/${key}`);
        });
    }
}


module.exports = each;
