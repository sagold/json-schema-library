// list of validation keywords: http://json-schema.org/latest/json-schema-validation.html#rfc.section.5
// ajv overview https://epoberezkin.github.io/ajv/keywords.html
// - ADD format(s), required, additionalProperties, patternProperties
const KeywordValidation = {
    additionalProperties: (core, schema, value, pointer) => {
        if (schema.additionalProperties === undefined || schema.additionalProperties === true) {
            return undefined;
        }

        const receivedProperties = Object.keys(value);
        const expectedProperties = Object.keys(schema.properties || {});

        // return an error if wie received an unexpected property
        for (let i = 0, l = receivedProperties.length; i < l; i += 1) {
            const property = receivedProperties[i];
            if (expectedProperties.indexOf(property) === -1) {
                if (typeof schema.additionalProperties === "object") {
                    if (core.validate(schema.additionalProperties, value[property], pointer).length !== 0) {
                        return new core.errors.AdditionalPropertiesError({
                            schema: schema.additionalProperties,
                            property: receivedProperties[i],
                            properties: expectedProperties, pointer
                        });
                    }
                } else {
                    return new core.errors.NoAdditionalPropertiesError(
                        { property: receivedProperties[i], properties: expectedProperties, pointer }
                    );
                }
            }
        }
        return undefined;
    },
    "enum": (core, schema, value, pointer) => {
        if (schema.enum && schema.enum.indexOf(value) === -1) {
            return new core.errors.EnumError({ values: schema.enum, value, pointer });
        }
        return undefined;
    },
    format: (core, schema, value, pointer) => {
        // fail silently if given format is not defined
        if (schema.format && core.validateFormat[schema.format]) {
            return core.validateFormat[schema.format](schema, value, pointer);
        }
        return undefined;
    },
    maximum: (core, schema, value, pointer) => {
        if (schema.maximum && schema.maximum < value) {
            return new core.errors.MaximumError({ maximum: schema.maximum, length: value, pointer });
        }
        return undefined;
    },
    maxItems: (core, schema, value, pointer) => {
        if (isNaN(schema.maxItems) === false && schema.maxItems < value.length) {
            return new core.errors.MaxItemsError({ maxItems: schema.maxItems, length: value.length, pointer });
        }
        return undefined;
    },
    maxLength: (core, schema, value, pointer) => {
        if (schema.maxLength && schema.maxLength < value.length) {
            return new core.errors.MaxLengthError({ maxLength: schema.maxLength, length: value.length, pointer });
        }
        return undefined;
    },
    maxProperties: (core, schema, value, pointer) => {
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return new core.errors.MaxPropertiesError({
                maxProperties: schema.maxProperties,
                length: propertyCount,
                pointer
            });
        }
        return undefined;
    },
    minLength: (core, schema, value, pointer) => {
        if (schema.minLength && schema.minLength > value.length) {
            return new core.errors.MinLengthError({ minLength: schema.minLength, length: value.length, pointer });
        }
        return undefined;
    },
    minimum: (core, schema, value, pointer) => {
        if (schema.minimum && schema.minimum > value) {
            return new core.errors.MinimumError({ minimum: schema.minimum, length: value, pointer });
        }
        return undefined;
    },
    minItems: (core, schema, value, pointer) => {
        if (isNaN(schema.minItems) === false && schema.minItems > value.length) {
            return new core.errors.MinItemsError({ minItems: schema.minItems, length: value.length, pointer });
        }
        return undefined;
    },
    minProperties: (core, schema, value, pointer) => {
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.minProperties) === false && schema.minProperties > propertyCount) {
            return new core.errors.MinPropertiesError({
                minProperties: schema.minProperties,
                length: propertyCount, pointer
            });
        }
        return undefined;
    },
    multipleOf: (core, schema, value, pointer) => {
        if (schema.multipleOf && isNaN(schema.multipleOf) === false && (value % schema.multipleOf) !== 0) {
            return new core.errors.MultipleOfError({ multipleOf: schema.multipleOf, value, pointer });
        }
        return undefined;
    },
    not: (core, schema, value, pointer) => {
        if (schema.not && core.validate(schema.not, value, pointer).length === 0) {
            // @todo: pass errrors
            return new core.errors.NotError({ value, not: schema.not, pointer });
        }
        return undefined;
    },
    pattern: (core, schema, value, pointer) => {
        if (schema.pattern && (new RegExp(schema.pattern)).test(value) === false) {
            return new core.errors.PatternError({ pattern: schema.pattern, received: value, pointer });
        }
        return undefined;
    }
};


module.exports = KeywordValidation;

