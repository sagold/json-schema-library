const getTypeOf = require("../getTypeOf");
const validatePattern = require("./pattern");


const TypeValidation = {

    validate(schema, data, step, root) {
        const type = getTypeOf(data);
        if (type !== schema.type) {
            return false;
        }
        if (TypeValidation[type] == null) {
            return false;
        }
        return TypeValidation[type](schema, data, step, root);
    },

    string: (schema, value) => {
        if (schema.minLength && schema.minLength > value.length) {
            return false;
        } else if (schema.maxLength && schema.maxLength < value.length) {
            return false;
        }
        return validatePattern(schema, value);
    },
    number: (schema, value) => {
        if (schema.minimum && schema.minimum > value) {
            return false;
        } else if (schema.maximum && schema.maximum < value) {
            return false;
        }
        return schema;
    },
    array: (schema, value, step, root) => {
        if (value == null) {
            return false;
        }
        // validation
        if (isNaN(schema.minItems) === false && schema.minItems > value.length) {
            return false;
        }
        if (isNaN(schema.maxItems) === false && schema.maxItems < value.length) {
            return false;
        }
        // validate items: *ITEMS*
        // @todo: missing: additionalItems, items-array, items-object, uniqueItems
        for (var i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemSchema = step(i, schema, value, root);
            if (TypeValidation.validate(itemSchema, itemData, step, root) === false) {
                return false;
            }
        }
        return schema;
    },
    object: (schema, value, step, root) => {
        if (value == null) {
            return false;
        }
        // validation
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.minProperties) === false && schema.minProperties > propertyCount) {
            return false;
        }
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return false;
        }
        // validate properties
        // @todo: missing: required, additionalProperties, patternProperties
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            const itemSchema = step(key, schema, value, root);
            if (value[key] === undefined || TypeValidation.validate(itemSchema, value[key], step, root) === false) {
                return false;
            }
        }
        return schema;
    },
    boolean: (schema) => schema,
    null: (schema) => schema
};


module.exports = TypeValidation;

