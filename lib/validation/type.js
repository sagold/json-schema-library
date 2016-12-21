const getTypeOf = require("../getTypeOf");
const validatePattern = require("./pattern");


const TypeValidation = {

    validate(schema, data, root, step) {
        const type = getTypeOf(data);
        if (type !== schema.type) {
            return false;
        }
        if (TypeValidation[type] == null) {
            return false;
        }
        return TypeValidation[type](schema, data, root, step);
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
    array: (schema, value, root, step) => {
        if (value == null) {
            return false;
        }
        // validate items: *ITEMS*
        // @todo: missing: additionalItems, items-array, items-object, uniqueItems
        // @todo: use step and resolveRef
        for (var i = 0; i < value.length; i += 1) {
            const item = value[i];
            if (TypeValidation.validate(schema.items || { type: getTypeOf(item) }, item, root, step) === false) {
                return false;
            }
        }
        // validation
        if (isNaN(schema.minItems) === false && schema.minItems > value.length) {
            return false;
        }
        if (isNaN(schema.maxItems) === false && schema.maxItems < value.length) {
            return false;
        }
        return schema;
    },
    object: (schema, value, root, step) => {
        if (value == null) {
            return false;
        }
        // validate properties
        // @todo: missing: required, additionalProperties, patternProperties
        // @todo: use step and resolveRef
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (value[key] === undefined || TypeValidation.validate(schema.properties[key], value[key], root, step) === false) {
                return false;
            }
        }
        // validation
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.minProperties) === false && schema.minProperties > propertyCount) {
            return false;
        }
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return false;
        }
        return schema;
    },
    boolean: (schema) => schema,
    null: (schema) => schema
};


module.exports = TypeValidation;

