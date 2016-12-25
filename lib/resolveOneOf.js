const getTypeOf = require("./getTypeOf");
const resolveRef = require("./resolveRef");


function fuzzyObjectValue(core, one, data, pointer) {
    if (data == null) {
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
    if (schema.oneOfProperty) {
        const oneOfProperty = schema.oneOfProperty;
        const oneOfValue = data[schema.oneOfProperty];

        if (oneOfValue === undefined) {
            return new core.errors.MissingOneOfPropertyError({ property: oneOfProperty, pointer });
        }

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = resolveRef(schema.oneOf[i], core.rootSchema);
            const oneOfPropertySchema = core.step(oneOfProperty, one, data, pointer);

            if (oneOfPropertySchema instanceof Error) {
                return oneOfPropertySchema;
            }

            if (core.isValid(oneOfPropertySchema, oneOfValue, pointer)) {
                return schema.oneOf[i];
            }
        }

        return new core.errors.OneOfPropertyError({ property: oneOfProperty, value: oneOfValue, pointer });
    }

    // keyword: oneOf
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = resolveRef(schema.oneOf[i], core.rootSchema, pointer);
        if (core.isValid(one, data, pointer)) {
            return schema.oneOf[i];
        }
    }

    // fuzzy match oneOf
    if (getTypeOf(data) === "object") {
        let schemaOfItem;
        let fuzzyGreatest = 0;

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = resolveRef(schema.oneOf[i], core.rootSchema);
            const fuzzyValue = fuzzyObjectValue(core, one, data);

            if (fuzzyGreatest < fuzzyValue) {
                fuzzyGreatest = fuzzyValue;
                schemaOfItem = schema.oneOf[i];
            }
        }
        return schemaOfItem;
    }

    return new Error(`OneOfError: there is no oneOf schema for given value at ${pointer}`);
};
