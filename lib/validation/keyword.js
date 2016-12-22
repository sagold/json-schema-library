const Errors = require("./errors");


const KeywordValidation = {

    minLength: (schema, value, pointer) => {
        if (schema.minLength && schema.minLength > value.length) {
            return new Errors.MinLengthError({ minLength: schema.minLength, length: value.length, pointer });
        }
        return undefined;
    },
    maxLength: (schema, value, pointer) => {
        if (schema.maxLength && schema.maxLength < value.length) {
            return new Errors.MaxLengthError({ maxLength: schema.maxLength, length: value.length, pointer });
        }
        return undefined;
    },
    pattern: (schema, value, pointer) => {
        if (schema.pattern && (new RegExp(schema.pattern)).test(value) === false) {
            return new Errors.PatternError({ pattern: schema.pattern, pointer });
        }
        return undefined;
    },
    minimum: (schema, value, pointer) => {
        if (schema.minimum && schema.minimum > value) {
            return new Errors.MinimumError({ minimum: schema.minimum, length: value, pointer });
        }
        return undefined;
    },
    maximum: (schema, value, pointer) => {
        if (schema.maximum && schema.maximum < value) {
            return new Errors.MaximumError({ maximum: schema.maximum, length: value, pointer });
        }
        return undefined;
    },
    minProperties: (schema, value, pointer) => {
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.minProperties) === false && schema.minProperties > propertyCount) {
            return new Errors.MinPropertiesError({
                minProperties: schema.minProperties,
                length: propertyCount, pointer
            });
        }
        return undefined;
    },
    maxProperties: (schema, value, pointer) => {
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return new Errors.MaxPropertiesError({
                maxProperties: schema.maxProperties,
                length: propertyCount,
                pointer
            });
        }
        return undefined;
    },
    minItems: (schema, value, pointer) => {
        if (isNaN(schema.minItems) === false && schema.minItems > value.length) {
            return new Errors.MinItemsError({ minItems: schema.minItems, length: value.length, pointer });
        }
        return undefined;
    },
    maxItems: (schema, value, pointer) => {
        if (isNaN(schema.maxItems) === false && schema.maxItems < value.length) {
            return new Errors.MaxItemsError({ maxItems: schema.maxItems, length: value.length, pointer });
        }
        return undefined;
    }
};


module.exports = KeywordValidation;

