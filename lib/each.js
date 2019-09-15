const getTypeOf = require("./getTypeOf");


/**
 * Iterates over data, retrieving its schema
 *
 * @param  {CoreInterface} core - validator
 * @param  {Object} schema      - the schema matching the data
 * @param  {Mixed} data         - the data to iterate
 * @param  {Function} callback  - will be called with (schema, data, pointer) on each item
 * @param  {String} pointer     - pointer to given data
 */
function each(core, schema, data, callback, pointer = "#") {
    callback(schema, data, pointer);
    const dataType = getTypeOf(data);

    if (dataType === "object") {
        Object.keys(data).forEach(key => {
            const nextSchema = core.step(key, schema, data, pointer); // not save
            const next = data[key]; // save
            core.each(nextSchema, next, callback, `${pointer}/${key}`);
        });
    } else if (dataType === "array") {
        data.forEach((next, key) => {
            const nextSchema = core.step(key, schema, data, pointer);
            core.each(nextSchema, next, callback, `${pointer}/${key}`);
        });
    }
}


module.exports = each;
