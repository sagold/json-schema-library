import getTypeOf from "../getTypeOf";
import isSame from "../utils/deepCompare";
import settings from "../config/settings";
import ucs2decode from "../utils/punycode.ucs2decode";
import { isObject } from "../utils/isObject";
import { JsonValidator, isJsonError, JsonError } from "../types";
import { validateAllOf } from "../features/allOf";
import { validateAnyOf } from "../features/anyOf";
import { validateDependencies } from "../features/dependencies";
import { validateOneOf } from "../features/oneOf";
const FPP = settings.floatingPointPrecision;

const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasProperty = (value: Record<string, unknown>, property: string) =>
    !(value[property] === undefined || !hasOwnProperty.call(value, property));

// list of validation keywords: http://json-schema.org/latest/json-schema-validation.html#rfc.section.5
const KeywordValidation: Record<string, JsonValidator> = {
    additionalProperties: (draft, schema, value: Record<string, unknown>, pointer) => {
        if (schema.additionalProperties === true || schema.additionalProperties == null) {
            return undefined;
        }

        if (
            getTypeOf(schema.patternProperties) === "object" &&
            schema.additionalProperties === false
        ) {
            // this is an arrangement with patternProperties. patternProperties validate before additionalProperties:
            // https://spacetelescope.github.io/understanding-json-schema/reference/object.html#index-5
            return undefined;
        }

        const errors: JsonError[] = [];
        let receivedProperties = Object.keys(value).filter(
            (prop) => settings.propertyBlacklist.includes(prop) === false
        );
        const expectedProperties = Object.keys(schema.properties || {});

        if (getTypeOf(schema.patternProperties) === "object") {
            // filter received properties by matching patternProperties
            const patterns = Object.keys(schema.patternProperties).map(
                (pattern) => new RegExp(pattern)
            );
            receivedProperties = receivedProperties.filter((prop) => {
                for (let i = 0; i < patterns.length; i += 1) {
                    if (patterns[i].test(prop)) {
                        return false; // remove
                    }
                }
                return true;
            });
        }

        // adds an error for each an unexpected property
        for (let i = 0, l = receivedProperties.length; i < l; i += 1) {
            const property = receivedProperties[i];
            if (expectedProperties.indexOf(property) === -1) {
                const additionalIsObject = isObject(schema.additionalProperties);

                // additionalProperties { oneOf: [] }
                if (additionalIsObject && Array.isArray(schema.additionalProperties.oneOf)) {
                    const result = draft.resolveOneOf(
                        value[property],
                        schema.additionalProperties,
                        `${pointer}/${property}`
                    );
                    if (isJsonError(result)) {
                        errors.push(
                            draft.errors.additionalPropertiesError({
                                schema: schema.additionalProperties,
                                property: receivedProperties[i],
                                properties: expectedProperties,
                                pointer,
                                // pass all validation errors
                                errors: result.data.errors
                            })
                        );
                    } else {
                        errors.push(...draft.validate(value[property], result, pointer));
                    }

                    // additionalProperties {}
                } else if (additionalIsObject) {
                    errors.push(
                        ...draft.validate(
                            value[property],
                            schema.additionalProperties,
                            `${pointer}/${property}`
                        )
                    );
                } else {
                    errors.push(
                        draft.errors.noAdditionalPropertiesError({
                            property: receivedProperties[i],
                            properties: expectedProperties,
                            pointer
                        })
                    );
                }
            }
        }

        return errors;
    },

    allOf: validateAllOf,

    anyOf: validateAnyOf,

    dependencies: validateDependencies,

    enum: (draft, schema, value, pointer) => {
        const type = getTypeOf(value);
        if (type === "object" || type === "array") {
            const valueStr = JSON.stringify(value);
            for (let i = 0; i < schema.enum.length; i += 1) {
                if (JSON.stringify(schema.enum[i]) === valueStr) {
                    return undefined;
                }
            }
        } else if (schema.enum.includes(value)) {
            return undefined;
        }
        return draft.errors.enumError({ values: schema.enum, value, pointer });
    },
    format: (draft, schema, value, pointer) => {
        if (draft.validateFormat[schema.format]) {
            const errors = draft.validateFormat[schema.format](draft, schema, value, pointer);
            return errors;
        }
        // fail silently if given format is not defined
        return undefined;
    },
    items: (draft, schema, value: unknown[], pointer) => {
        // @draft >= 7 bool schema
        if (schema.items === false) {
            if (Array.isArray(value) && value.length === 0) {
                return undefined;
            }
            return draft.errors.invalidDataError({ pointer, value });
        }

        const errors: JsonError[] = [];
        for (let i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemSchema = draft.step(i, schema, value, pointer);
            if (isJsonError(itemSchema)) {
                return [itemSchema];
            }

            const itemErrors = draft.validate(itemData, itemSchema, `${pointer}/${i}`);
            errors.push(...itemErrors);
        }

        return errors;
    },
    maximum: (draft, schema, value, pointer) => {
        if (isNaN(schema.maximum)) {
            return undefined;
        }
        if (schema.maximum && schema.maximum < value) {
            return draft.errors.maximumError({ maximum: schema.maximum, length: value, pointer });
        }
        if (schema.maximum && schema.exclusiveMaximum === true && schema.maximum === value) {
            return draft.errors.maximumError({ maximum: schema.maximum, length: value, pointer });
        }
        return undefined;
    },
    maxItems: (draft, schema, value: unknown[], pointer) => {
        if (isNaN(schema.maxItems)) {
            return undefined;
        }
        if (schema.maxItems < value.length) {
            return draft.errors.maxItemsError({
                maximum: schema.maxItems,
                length: value.length,
                pointer
            });
        }
        return undefined;
    },
    maxLength: (draft, schema, value: string, pointer) => {
        if (isNaN(schema.maxLength)) {
            return undefined;
        }
        const lengthOfString = ucs2decode(value).length;
        if (schema.maxLength < lengthOfString) {
            return draft.errors.maxLengthError({
                maxLength: schema.maxLength,
                length: lengthOfString,
                pointer
            });
        }
        return undefined;
    },
    maxProperties: (draft, schema, value, pointer) => {
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return draft.errors.maxPropertiesError({
                maxProperties: schema.maxProperties,
                length: propertyCount,
                pointer
            });
        }
        return undefined;
    },
    minLength: (draft, schema, value: string, pointer) => {
        if (isNaN(schema.minLength)) {
            return undefined;
        }
        const lengthOfString = ucs2decode(value).length;
        if (schema.minLength > lengthOfString) {
            if (schema.minLength === 1) {
                return draft.errors.minLengthOneError({
                    minLength: schema.minLength,
                    length: lengthOfString,
                    pointer
                });
            }
            return draft.errors.minLengthError({
                minLength: schema.minLength,
                length: lengthOfString,
                pointer
            });
        }
        return undefined;
    },
    minimum: (draft, schema, value, pointer) => {
        if (isNaN(schema.minimum)) {
            return undefined;
        }
        if (schema.minimum > value) {
            return draft.errors.minimumError({ minimum: schema.minimum, length: value, pointer });
        }
        if (schema.exclusiveMinimum === true && schema.minimum === value) {
            return draft.errors.minimumError({ minimum: schema.minimum, length: value, pointer });
        }
        return undefined;
    },
    minItems: (draft, schema, value: unknown[], pointer) => {
        if (isNaN(schema.minItems)) {
            return undefined;
        }
        if (schema.minItems > value.length) {
            if (schema.minItems === 1) {
                return draft.errors.minItemsOneError({
                    minItems: schema.minItems,
                    length: value.length,
                    pointer
                });
            }
            return draft.errors.minItemsError({
                minItems: schema.minItems,
                length: value.length,
                pointer
            });
        }
        return undefined;
    },
    minProperties: (draft, schema, value, pointer) => {
        if (isNaN(schema.minProperties)) {
            return undefined;
        }
        const propertyCount = Object.keys(value).length;
        if (schema.minProperties > propertyCount) {
            return draft.errors.minPropertiesError({
                minProperties: schema.minProperties,
                length: propertyCount,
                pointer
            });
        }
        return undefined;
    },
    multipleOf: (draft, schema, value: number, pointer) => {
        if (isNaN(schema.multipleOf)) {
            return undefined;
        }
        // https://github.com/cfworker/cfworker/blob/master/packages/json-schema/src/validate.ts#L1061
        // https://github.com/ExodusMovement/schemasafe/blob/master/src/compile.js#L441
        if (((value * FPP) % (schema.multipleOf * FPP)) / FPP !== 0) {
            return draft.errors.multipleOfError({ multipleOf: schema.multipleOf, value, pointer });
        }
        // also check https://stackoverflow.com/questions/1815367/catch-and-compute-overflow-during-multiplication-of-two-large-integers
        return undefined;
    },
    not: (draft, schema, value, pointer) => {
        const errors: JsonError[] = [];
        if (draft.validate(value, schema.not, pointer).length === 0) {
            errors.push(draft.errors.notError({ value, not: schema.not, pointer }));
        }
        return errors;
    },
    oneOf: validateOneOf,
    pattern: (draft, schema, value: string, pointer) => {
        const pattern = new RegExp(schema.pattern, "u");
        if (pattern.test(value) === false) {
            return draft.errors.patternError({
                pattern: schema.pattern,
                description: schema.patternExample || schema.pattern,
                received: value,
                pointer
            });
        }
        return undefined;
    },
    patternProperties: (draft, schema, value: Record<string, unknown>, pointer) => {
        const properties = schema.properties || {};
        const pp = schema.patternProperties;
        if (getTypeOf(pp) !== "object") {
            return undefined;
        }

        const errors: JsonError[] = [];
        const keys = Object.keys(value);
        const patterns = Object.keys(pp).map((expr) => ({
            regex: new RegExp(expr),
            patternSchema: pp[expr]
        }));

        keys.forEach((key) => {
            let patternFound = false;

            for (let i = 0, l = patterns.length; i < l; i += 1) {
                if (patterns[i].regex.test(key)) {
                    patternFound = true;
                    const valErrors = draft.validate(
                        value[key],
                        patterns[i].patternSchema,
                        `${pointer}/${key}`
                    );
                    if (valErrors && valErrors.length > 0) {
                        errors.push(...valErrors);
                    }
                }
            }

            if (properties[key]) {
                return;
            }

            if (patternFound === false && schema.additionalProperties === false) {
                // this is an arrangement with additionalProperties
                errors.push(
                    draft.errors.patternPropertiesError({
                        key,
                        pointer,
                        patterns: Object.keys(pp).join(",")
                    })
                );
            }
        });

        return errors;
    },
    properties: (draft, schema, value: Record<string, unknown>, pointer) => {
        const errors: JsonError[] = [];
        const keys = Object.keys(schema.properties || {});
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (hasProperty(value, key)) {
                const itemSchema = draft.step(key, schema, value, pointer);
                const keyErrors = draft.validate(value[key], itemSchema, `${pointer}/${key}`);
                errors.push(...keyErrors);
            }
        }
        return errors;
    },
    // @todo move to separate file: this is custom keyword validation for JsonEditor.properties keyword
    propertiesRequired: (draft, schema, value: Record<string, unknown>, pointer) => {
        const errors: JsonError[] = [];
        const keys = Object.keys(schema.properties || {});
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (value[key] === undefined) {
                errors.push(draft.errors.requiredPropertyError({ key, pointer }));
            } else {
                const itemSchema = draft.step(key, schema, value, pointer);
                const keyErrors = draft.validate(value[key], itemSchema, `${pointer}/${key}`);
                errors.push(...keyErrors);
            }
        }
        return errors;
    },
    required: (draft, schema, value: Record<string, unknown>, pointer) => {
        if (Array.isArray(schema.required) === false) {
            return undefined;
        }

        return schema.required.map((property: string) => {
            if (!hasProperty(value, property)) {
                return draft.errors.requiredPropertyError({ key: property, pointer });
            }
            return undefined;
        });
    },
    // @todo move to separate file: this is custom keyword validation for JsonEditor.required keyword
    requiredNotEmpty: (draft, schema, value: Record<string, unknown>, pointer) => {
        if (Array.isArray(schema.required) === false) {
            return undefined;
        }

        return schema.required.map((property: string) => {
            if (value[property] == null || value[property] === "") {
                return draft.errors.valueNotEmptyError({
                    property,
                    pointer: `${pointer}/${property}`
                });
            }
            return undefined;
        });
    },
    uniqueItems: (draft, schema, value: unknown[], pointer) => {
        if ((Array.isArray(value) && schema.uniqueItems) === false) {
            return undefined;
        }

        const errors: JsonError[] = [];
        value.forEach((item, index) => {
            for (let i = index + 1; i < value.length; i += 1) {
                if (isSame(item, value[i])) {
                    errors.push(
                        draft.errors.uniqueItemsError({
                            pointer,
                            itemPointer: `${pointer}/${index}`,
                            duplicatePointer: `${pointer}/${i}`,
                            value: JSON.stringify(item)
                        })
                    );
                }
            }
        });

        return errors;
    }
};

export default KeywordValidation;
