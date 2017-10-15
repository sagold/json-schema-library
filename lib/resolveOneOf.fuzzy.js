const filter = require("./utils/filter");
const flattenArray = require("./utils/flattenArray");
const getTypeOf = require("./getTypeOf");


/**
 * Returns a ranking for the data and given schema
 *
 * @param  {CoreInterface} core
 * @param  {Object} one     - json schema type: object
 * @param  {Object} data
 * @param  {String} pointer
 * @return {Number} ranking value (higher is better)
 */
function fuzzyObjectValue(core, one, data, pointer) {
    if (data == null || one.properties == null) {
        return -1;
    }

    let value = 0;
    const keys = Object.keys(one.properties);
    for (var i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (data[key] != null && core.isValid(one.properties[key], data[key], pointer)) {
            value += 1;
        }
    }

    return value;
}

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

    // !keyword: oneOfProperty
    // an additional `oneOfProperty` on the schema will exactly determine the oneOf value (if set in data)

    // @fixme
    // abort if no data is given an oneOfProperty is set (used by getChildSchemaSelection)
    // this case (data != null) should not be necessary
    if (data != null && schema.oneOfProperty) {

        const errors = [];
        const oneOfProperty = schema.oneOfProperty;
        const oneOfValue = data[schema.oneOfProperty];

        if (oneOfValue === undefined) {
            return core.errors.missingOneOfPropertyError({ property: oneOfProperty, pointer });
        }

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = core.resolveRef(schema.oneOf[i]);
            const oneOfPropertySchema = core.step(oneOfProperty, one, data, pointer);

            if (oneOfPropertySchema && oneOfPropertySchema.type === "error") {
                return oneOfPropertySchema;
            }

            let result = flattenArray(core.validate(oneOfPropertySchema, oneOfValue, pointer));
            result = result.filter(filter.errorOrPromise);

            if (result.length > 0) {
                errors.push(...result);
            } else {
                return schema.oneOf[i];
            }
        }

        return core.errors.oneOfPropertyError({ property: oneOfProperty, value: oneOfValue, pointer, errors });
    }

    // keyword: oneOf
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

    // fuzzy match oneOf
    if (getTypeOf(data) === "object") {
        let schemaOfItem;
        let fuzzyGreatest = 0;

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = core.resolveRef(schema.oneOf[i]);
            const fuzzyValue = fuzzyObjectValue(core, one, data);

            if (fuzzyGreatest < fuzzyValue) {
                fuzzyGreatest = fuzzyValue;
                schemaOfItem = schema.oneOf[i];
            }
        }
        return schemaOfItem;
    }

    if (matches.length > 1) {
        return core.errors.multipleOneOfError({ matches, data, pointer });
    }

    return core.errors.oneOfError({ value: JSON.stringify(data), pointer, oneOf: schema.oneOf });
};
