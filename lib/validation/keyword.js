const getTypeOf = require("../getTypeOf");

// list of validation keywords: http://json-schema.org/latest/json-schema-validation.html#rfc.section.5
// ajv overview https://epoberezkin.github.io/ajv/keywords.html
// - ADD required, patternProperties
// - ADD keyword type?
const KeywordValidation = {
    additionalProperties: (core, schema, value, pointer) => {
        if (schema.additionalProperties === true) {
            return undefined;
        }

        if (getTypeOf(schema.patternProperties) === "object" && schema.additionalProperties === false) {
            // this is an arrangement with patternProperties. patternProperties validate before additionalProperties:
            // https://spacetelescope.github.io/understanding-json-schema/reference/object.html#index-5
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
            const errors = core.validateFormat[schema.format](core, schema, value, pointer);
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

            const itemErrors = core.validate(itemSchema, itemData, simpleJoin(pointer, i));
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
            return core.errors.patternError({
                pattern: schema.pattern,
                description: schema.patternExample || schema.pattern,
                received: value, pointer
            });
        }
        return undefined;
    },
    patternProperties: (core, schema, value, pointer) => {
        const properties = schema.properties || {};
        const pp = schema.patternProperties;
        if (getTypeOf(pp) !== "object") {
            return undefined;
        }

        const errors = [];
        const keys = Object.keys(value);
        const patterns = Object.keys(pp).map((expr) => ({
            regex: new RegExp(expr),
            patternSchema: pp[expr]
        }));

        keys.forEach((key) => {
            if (properties[key]) {
                return;
            }

            for (let i = 0, l = patterns.length; i < l; i += 1) {
                if (patterns[i].regex.test(key)) {
                    const valErrors = core.validate(patterns[i].patternSchema, value[key], simpleJoin(pointer, key));
                    if (valErrors && valErrors.length > 0) {
                        errors.push(valErrors);
                    }
                    return;
                }
            }

            if (schema.additionalProperties === false) {
                // this is an arrangement with additionalProperties
                errors.push(core.errors.patternPropertiesError({
                    key, pointer, patterns: Object.keys(pp).join(",")
                }));
            }
        });

        return errors;
    },
    properties: (core, schema, value, pointer) => {
        const errors = [];
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (value[key] !== undefined) {
                const itemSchema = core.step(key, schema, value, pointer);
                const keyErrors = core.validate(itemSchema, value[key], simpleJoin(pointer, key));
                errors.push(...keyErrors);
            }
        }
        return errors;
    },
    // @todo move to separate file: this is custom keyword validation for JsonEditor.properties keyword
    propertiesRequired: (core, schema, value, pointer) => {
        const errors = [];
        const keys = Object.keys(schema.properties || {});
        for (var i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (value[key] === undefined) {
                errors.push(core.errors.requiredPropertyError({ key, pointer }));
            } else {
                const itemSchema = core.step(key, schema, value, pointer);
                const keyErrors = core.validate(itemSchema, value[key], simpleJoin(pointer, key));
                errors.push(...keyErrors);
            }
        }
        return errors;
    },
    required: (core, schema, value, pointer) => {
        if (Array.isArray(schema.required) === false) {
            return undefined;
        }

        return schema.required.map((property) => {
            if (value[property] === undefined) {
                return core.errors.requiredPropertyError({ key: property, pointer });
            }
            return undefined;
        });
    },
    // @todo move to separate file: this is custom keyword validation for JsonEditor.required keyword
    requiredNotEmpty: (core, schema, value, pointer) => {
        if (Array.isArray(schema.required) === false) {
            return undefined;
        }

        return schema.required.map((property) => {
            if (value[property] == null || value[property] === "") {
                return core.errors.valueNotEmptyError({ property, pointer: simpleJoin(pointer, property) });
            }
            return undefined;
        });
    },
    uniqueItems: (core, schema, value, pointer) => {
        if (schema.uniqueItems !== true || Array.isArray(value) === false) {
            return undefined;
        }

        const errors = [];
        const map = {};
        value.forEach((item, index) => {
            const id = JSON.stringify(item);
            const itemPointer = simpleJoin(pointer, index);
            if (map[id]) {
                errors.push(core.errors.uniqueItemsError({
                    pointer,
                    itemPointer: map[id],
                    duplicatePointer: itemPointer,
                    value: id
                }));
            } else {
                map[id] = itemPointer;
            }
        });

        return errors;
    }
};

function simpleJoin(...args) {
    return args.join("/");
}


module.exports = KeywordValidation;

