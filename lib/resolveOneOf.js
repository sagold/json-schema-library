const resolveRef = require("./resolveRef");
const getTypeOf = require("./getTypeOf");
const isValid = require("./isValid");
const Errors = require("./validation/errors");


function fuzzyObjectValue(one, data, step, rootSchema) {
    if (data == null) {
        return -1;
    }

    let value = 0;
    const keys = Object.keys(one.properties);
    for (var i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (data[key] != null && isValid(one.properties[key], data[key], step, rootSchema, "#")) {
            value += 1;
        }
    }

    return value;
}


module.exports = function resolveOneOf(schema, data, step, rootSchema = schema, pointer) {
    if (typeof step !== "function") {
        throw new Error(`Expected step to be a function. Got: ${typeof step}`);
    }

    // !keyword: oneOfProperty
    if (schema.oneOfProperty) {
        const oneOfProperty = schema.oneOfProperty;
        const oneOfValue = data[schema.oneOfProperty];

        if (oneOfValue === undefined) {
            return new Errors.MissingOneOfPropertyError({ property: oneOfProperty, pointer });
        }

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = resolveRef(schema.oneOf[i], rootSchema);
            const oneOfPropertySchema = step(oneOfProperty, one, data, rootSchema, pointer);

            if (oneOfPropertySchema instanceof Error) {
                return oneOfPropertySchema;
            }

            if (isValid(oneOfPropertySchema, oneOfValue, step, rootSchema, "#")) {
                return schema.oneOf[i];
            }
        }

        return new Errors.OneOfPropertyError({ property: oneOfProperty, value: oneOfValue, pointer });
    }

    // keyword: oneOf
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = resolveRef(schema.oneOf[i], rootSchema);
        if (isValid(one, data, step, rootSchema, "#")) {
            return schema.oneOf[i];
        }
    }

    // fuzzy match oneOf
    if (getTypeOf(data) === "object") {
        let schemaOfItem;
        let fuzzyGreatest = 0;
        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = resolveRef(schema.oneOf[i], rootSchema);
            const fuzzyValue = fuzzyObjectValue(one, data, step, rootSchema);
            if (fuzzyGreatest < fuzzyValue) {
                fuzzyGreatest = fuzzyValue;
                schemaOfItem = schema.oneOf[i];
            }
        }
        return schemaOfItem;
    }

    return false;
};
