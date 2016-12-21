const getTypeOf = require("../getTypeOf");
const validatePattern = require("./pattern");

const TypeValidation = {

    validate(schema, data, step, root) {
        const type = getTypeOf(data);
        if (type !== schema.type) {
            return [new Error(`Mismatching type ${type}`)];
        }
        if (TypeValidation[type] == null) {
            return [new Error(`Invalid type ${type}`)];
        }
        const errors = TypeValidation[type](schema, data, step, root);
        if (Array.isArray(errors)) {
            return errors;
        }
        return [errors];
    },

    string: (schema, value) => {
        if (schema.minLength && schema.minLength > value.length) {
            return new Error("minLength of string");
        } else if (schema.maxLength && schema.maxLength < value.length) {
            return new Error("maxLength of string");
        }
        if (validatePattern(schema, value) === false) {
            return new Error("pattern");
        }
        return [];
    },
    number: (schema, value) => {
        if (schema.minimum && schema.minimum > value) {
            return new Error("minimum of number");
        } else if (schema.maximum && schema.maximum < value) {
            return new Error("maximum of number");
        }
        return [];
    },
    array: (schema, value, step, root) => {
        if (value == null) {
            return new Error("array undefined");
        }
        // validation
        if (isNaN(schema.minItems) === false && schema.minItems > value.length) {
            return new Error("minItems of array");
        }
        if (isNaN(schema.maxItems) === false && schema.maxItems < value.length) {
            return new Error("maxItems of array");
        }
        // validate items: *ITEMS*
        // @todo: missing: additionalItems, items-array, items-object, uniqueItems
        for (var i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemSchema = step(i, schema, value, root);
            const errors = TypeValidation.validate(itemSchema, itemData, step, root);
            if (errors.length) {
                return errors;
            }
        }
        return [];
    },
    object: (schema, value, step, root) => {
        if (value == null) {
            return new Error("object undefined");
        }
        // validation
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.minProperties) === false && schema.minProperties > propertyCount) {
            return new Error("minProperties of object");
        }
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return new Error("maxProperties of object");
        }
        // validate properties
        // @todo: missing: required, additionalProperties, patternProperties
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            const itemSchema = step(key, schema, value, root);
            if (value[key] === undefined) {
                return new Error("undefined key in object");
            }
            const errors = TypeValidation.validate(itemSchema, value[key], step, root);
            if (errors.length) {
                return errors;
            }
        }
        return [];
    },
    boolean: (schema) => [],
    null: (schema) => []
};


module.exports = TypeValidation;

