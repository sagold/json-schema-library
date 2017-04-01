// list of validation keywords: http://json-schema.org/latest/json-schema-validation.html#rfc.section.5
// ajv overview https://epoberezkin.github.io/ajv/keywords.html
// - ADD required, patternProperties
// - ADD properties, items, type?
const KeywordValidation = {
    additionalProperties: (core, schema, value, pointer) => {
        if (schema.additionalProperties === true) {
            return undefined;
        }

        const errors = [];
        const receivedProperties = Object.keys(value);
        const expectedProperties = Object.keys(schema.properties || {});

        // adds an error for each an unexpected property
        for (let i = 0, l = receivedProperties.length; i < l; i += 1) {
            const property = receivedProperties[i];
            if (expectedProperties.indexOf(property) === -1) {
                if (typeof schema.additionalProperties === "object") {
                    if (core.validate(schema.additionalProperties, value[property], pointer).length !== 0) {
                        errors.push(core.errors.additionalPropertiesError({
                            schema: schema.additionalProperties,
                            property: receivedProperties[i],
                            properties: expectedProperties, pointer
                        }));
                    }
                } else {
                    errors.push(core.errors.noAdditionalPropertiesError(
                        { property: receivedProperties[i], properties: expectedProperties, pointer }
                    ));
                }
            }
        }
        return errors;
    },
    "enum": (core, schema, value, pointer) => {
        // @todo: enum supports all types, a comparison of objects requries an deep equal (ordered Json.stringify?)
        if (schema.enum.indexOf(value) === -1) {
            return core.errors.enumError({ values: schema.enum, value, pointer });
        }
        return undefined;
    },
    format: (core, schema, value, pointer) => {
        if (core.validateFormat[schema.format]) {
            const errors = core.validateFormat[schema.format](schema, value, pointer);
            return errors;
        }
        // fail silently if given format is not defined
        return undefined;
    },
    items: (core, schema, value, pointer) => {
        const errors = [];
        for (var i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemSchema = core.step(i, schema, value, pointer);

            if (itemSchema && itemSchema.type === "error") {
                return [itemSchema];
            }

            const itemErrors = core.validate(itemSchema, itemData, join(pointer, i));
            errors.push(...itemErrors);
        }

        return errors;
    },
    maximum: (core, schema, value, pointer) => {
        if (isNaN(schema.maximum)) {
            return undefined;
        }
        if (schema.maximum && schema.maximum < value) {
            return core.errors.maximumError({ maximum: schema.maximum, length: value, pointer });
        }
        if (schema.maximum && schema.exclusiveMaximum === true && schema.maximum === value) {
            return core.errors.maximumError({ maximum: schema.maximum, length: value, pointer });
        }
        return undefined;
    },
    maxItems: (core, schema, value, pointer) => {
        if (isNaN(schema.maxItems)) {
            return undefined;
        }
        if (schema.maxItems < value.length) {
            return core.errors.maxItemsError({ maximum: schema.maxItems, length: value.length, pointer });
        }
        return undefined;
    },
    maxLength: (core, schema, value, pointer) => {
        if (isNaN(schema.maxLength)) {
            return undefined;
        }
        if (schema.maxLength < value.length) {
            return core.errors.maxLengthError({ maxLength: schema.maxLength, length: value.length, pointer });
        }
        return undefined;
    },
    maxProperties: (core, schema, value, pointer) => {
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return core.errors.maxPropertiesError({
                maxProperties: schema.maxProperties,
                length: propertyCount,
                pointer
            });
        }
        return undefined;
    },
    minLength: (core, schema, value, pointer) => {
        if (isNaN(schema.minLength)) {
            return undefined;
        }
        if (schema.minLength > value.length) {
            return core.errors.minLengthError({ minLength: schema.minLength, length: value.length, pointer });
        }
        return undefined;
    },
    minimum: (core, schema, value, pointer) => {
        if (isNaN(schema.minimum)) {
            return undefined;
        }
        if (schema.minimum > value) {
            return core.errors.minimumError({ minimum: schema.minimum, length: value, pointer });
        }
        if (schema.exclusiveMinimum === true && schema.minimum === value) {
            return core.errors.minimumError({ minimum: schema.minimum, length: value, pointer });
        }
        return undefined;
    },
    minItems: (core, schema, value, pointer) => {
        if (isNaN(schema.minItems)) {
            return undefined;
        }
        if (schema.minItems > value.length) {
            return core.errors.minItemsError({ minItems: schema.minItems, length: value.length, pointer });
        }
        return undefined;
    },
    minProperties: (core, schema, value, pointer) => {
        if (isNaN(schema.minProperties)) {
            return undefined;
        }
        const propertyCount = Object.keys(value).length;
        if (schema.minProperties > propertyCount) {
            return core.errors.minPropertiesError({
                minProperties: schema.minProperties,
                length: propertyCount, pointer
            });
        }
        return undefined;
    },
    multipleOf: (core, schema, value, pointer) => {
        if (isNaN(schema.multipleOf)) {
            return undefined;
        }
        if ((value % schema.multipleOf) !== 0) {
            return core.errors.multipleOfError({ multipleOf: schema.multipleOf, value, pointer });
        }
        return undefined;
    },
    not: (core, schema, value, pointer) => {
        const errors = [];
        if (core.validate(schema.not, value, pointer).length === 0) {
            errors.push(core.errors.notError({ value, not: schema.not, pointer }));
        }
        return errors;
    },
    pattern: (core, schema, value, pointer) => {
        if ((new RegExp(schema.pattern)).test(value) === false) {
            return core.errors.patternError({ pattern: schema.pattern, received: value, pointer });
        }
        return undefined;
    },
    properties: (core, schema, value, pointer) => {
        const errors = [];
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            const itemSchema = core.step(key, schema, value, pointer);
            if (value[key] === undefined) {
                errors.push(core.errors.missingKeyError({ key, pointer }));
            } else {
                const keyErrors = core.validate(itemSchema, value[key], join(pointer, key));
                errors.push(...keyErrors);
            }
        }
        return errors;
    }
};

function join(...args) {
    return args.join("/");
}


module.exports = KeywordValidation;

