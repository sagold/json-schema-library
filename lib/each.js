const getTypeOf = require("./getTypeOf");


/**
 * Iterates over data, retrieving its schema
 *
 * @param  {CoreInterface} core - validator
 * @param  {Mixed} data         - the data to iterate
 * @param  {Function} callback  - will be called with (schema, data, pointer) on each item
 * @param  {Object} [schema]    - the schema matching the data. Defaults to rootSchema
 * @param  {String} [pointer]   - pointer to current data. Default to rootPointer
 */
function each(core, data, callback, schema = core.rootSchema, pointer = "#") {
    callback(schema, data, pointer);
    const dataType = getTypeOf(data);

    if (dataType === "object") {
        Object.keys(data).forEach(key => {
            const nextSchema = core.step(key, schema, data, pointer); // not save
            const next = data[key]; // save
            core.each(next, callback, nextSchema, `${pointer}/${key}`);
        });
    } else if (dataType === "array") {
        data.forEach((next, key) => {
            const nextSchema = core.step(key, schema, data, pointer);
            core.each(next, callback, nextSchema, `${pointer}/${key}`);
        });
    }
}


module.exports = each;
