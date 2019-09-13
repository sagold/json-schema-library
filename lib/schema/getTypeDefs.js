const gp = require("gson-pointer");
const gq = require("gson-query");
const getTypeId = require("./getTypeId");
const types = require("./types");
const isObject = value => Object.prototype.toString.call(value) === "[object Object]";


/**
 * Returns a list of all (direct) type definitions from the given schema
 * @param  {Object} schema
 * @return {Array} list of type definition, given as { pointer, def }
 */
module.exports = function getTypeDefs(schema) {
    const defs = [];
    const id = getTypeId(schema);
    if (id == null) {
        return defs;
    }
    const type = types[id];
    if (type.definitions == null) {
        return defs;
    }
    type.definitions.forEach(query => {
        gq.run(schema, query, (value, key, parent, pointer) => {
            if (isObject(value) && getTypeId(value)) {
                defs.push({ pointer: gp.join(gp.split(pointer), false), def: value });
            }
        });
    });
    return defs;
};
