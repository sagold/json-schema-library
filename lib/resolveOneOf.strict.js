/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param  {CoreInterface} core - validator
 * @param  {Object} schema      - current json schema containing property oneOf
 * @param  {Mixed} data
 * @param  {String} pointer     - json pointer to data
 * @return {Object|Error} oneOf schema or an error
 */
module.exports = function resolveOneOf(core, schema, data, pointer) {
    const matches = [];
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = core.resolveRef(schema.oneOf[i]);
        if (core.isValid(one, data, pointer)) {
            matches.push(schema.oneOf[i]);
        }
    }

    if (matches.length === 1) {
        return matches[0];
    }
    if (matches.length > 1) {
        return new core.errors.MultipleOneOfError({ value: data, pointer, matches });
    }

    return new core.errors.OneOfError({ value: data, pointer, oneOf: schema.oneOf });
};
