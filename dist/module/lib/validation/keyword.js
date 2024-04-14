import getTypeOf from "../getTypeOf";
import settings from "../config/settings";
import ucs2decode from "../utils/punycode.ucs2decode";
import { isObject } from "../utils/isObject";
import { isJsonError } from "../types";
import { validateAllOf } from "../features/allOf";
import { validateAnyOf } from "../features/anyOf";
import { validateDependencies } from "../features/dependencies";
import { validateOneOf } from "../features/oneOf";
import { getPrecision } from "../utils/getPrecision";
import deepEqual from "fast-deep-equal";
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasProperty = (value, property) => !(value[property] === undefined || !hasOwnProperty.call(value, property));
// list of validation keywords: http://json-schema.org/latest/json-schema-validation.html#rfc.section.5
const KeywordValidation = {
    additionalProperties: (node, value) => {
        const { draft, schema, pointer } = node;
        if (schema.additionalProperties === true || schema.additionalProperties == null) {
            return undefined;
        }
        if (getTypeOf(schema.patternProperties) === "object" &&
            schema.additionalProperties === false) {
            // this is an arrangement with patternProperties. patternProperties validate before additionalProperties:
            // https://spacetelescope.github.io/understanding-json-schema/reference/object.html#index-5
            return undefined;
        }
        const errors = [];
        let receivedProperties = Object.keys(value).filter((prop) => settings.propertyBlacklist.includes(prop) === false);
        const expectedProperties = Object.keys(schema.properties || {});
        if (getTypeOf(schema.patternProperties) === "object") {
            // filter received properties by matching patternProperties
            const patterns = Object.keys(schema.patternProperties).map((pattern) => new RegExp(pattern));
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
                    const result = draft.resolveOneOf(node.next(schema.additionalProperties), value[property]);
                    if (isJsonError(result)) {
                        errors.push(draft.errors.additionalPropertiesError({
                            pointer,
                            schema: schema.additionalProperties,
                            value,
                            property: receivedProperties[i],
                            properties: expectedProperties,
                            // pass all validation errors
                            errors: result.data.errors
                        }));
                    }
                    else {
                        errors.push(...draft.validate(node.next(result, property), value[property]));
                    }
                    // additionalProperties {}
                }
                else if (additionalIsObject) {
                    const res = draft.validate(node.next(schema.additionalProperties, property), value[property]);
                    errors.push(...res);
                }
                else {
                    errors.push(draft.errors.noAdditionalPropertiesError({
                        pointer,
                        schema,
                        value,
                        property: receivedProperties[i],
                        properties: expectedProperties
                    }));
                }
            }
        }
        return errors;
    },
    allOf: validateAllOf,
    anyOf: validateAnyOf,
    dependencies: validateDependencies,
    enum: (node, value) => {
        const { draft, schema, pointer } = node;
        const type = getTypeOf(value);
        if (type === "object" || type === "array") {
            const valueStr = JSON.stringify(value);
            for (let i = 0; i < schema.enum.length; i += 1) {
                if (JSON.stringify(schema.enum[i]) === valueStr) {
                    return undefined;
                }
            }
        }
        else if (schema.enum.includes(value)) {
            return undefined;
        }
        return draft.errors.enumError({ pointer, schema, value, values: schema.enum });
    },
    format: (node, value) => {
        const { draft, schema } = node;
        if (draft.validateFormat[schema.format]) {
            const errors = draft.validateFormat[schema.format](node, value);
            return errors;
        }
        // fail silently if given format is not defined
        return undefined;
    },
    items: (node, value) => {
        const { draft, schema, pointer } = node;
        // @draft >= 7 bool schema
        if (schema.items === false) {
            if (Array.isArray(value) && value.length === 0) {
                return undefined;
            }
            return draft.errors.invalidDataError({ pointer, value, schema });
        }
        const errors = [];
        for (let i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemNode = draft.step(node.next(schema), i, value);
            if (isJsonError(itemNode)) {
                return [itemNode];
            }
            const itemErrors = draft.validate(itemNode, itemData);
            errors.push(...itemErrors);
        }
        return errors;
    },
    maximum: (node, value) => {
        const { draft, schema, pointer } = node;
        if (isNaN(schema.maximum)) {
            return undefined;
        }
        if (schema.maximum && schema.maximum < value) {
            return draft.errors.maximumError({
                maximum: schema.maximum,
                length: value,
                value,
                pointer,
                schema
            });
        }
        if (schema.maximum && schema.exclusiveMaximum === true && schema.maximum === value) {
            return draft.errors.maximumError({
                maximum: schema.maximum,
                length: value,
                pointer,
                schema,
                value
            });
        }
        return undefined;
    },
    maxItems: (node, value) => {
        const { draft, schema, pointer } = node;
        if (isNaN(schema.maxItems)) {
            return undefined;
        }
        if (schema.maxItems < value.length) {
            return draft.errors.maxItemsError({
                maximum: schema.maxItems,
                length: value.length,
                schema,
                value,
                pointer
            });
        }
        return undefined;
    },
    maxLength: (node, value) => {
        const { draft, schema, pointer } = node;
        if (isNaN(schema.maxLength)) {
            return undefined;
        }
        const lengthOfString = ucs2decode(value).length;
        if (schema.maxLength < lengthOfString) {
            return draft.errors.maxLengthError({
                maxLength: schema.maxLength,
                length: lengthOfString,
                pointer,
                schema,
                value
            });
        }
        return undefined;
    },
    maxProperties: (node, value) => {
        const { draft, schema, pointer } = node;
        const propertyCount = Object.keys(value).length;
        if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
            return draft.errors.maxPropertiesError({
                maxProperties: schema.maxProperties,
                length: propertyCount,
                pointer,
                schema,
                value
            });
        }
        return undefined;
    },
    minLength: (node, value) => {
        const { draft, schema, pointer } = node;
        if (isNaN(schema.minLength)) {
            return undefined;
        }
        const lengthOfString = ucs2decode(value).length;
        if (schema.minLength > lengthOfString) {
            if (schema.minLength === 1) {
                return draft.errors.minLengthOneError({
                    minLength: schema.minLength,
                    length: lengthOfString,
                    pointer,
                    schema,
                    value
                });
            }
            return draft.errors.minLengthError({
                minLength: schema.minLength,
                length: lengthOfString,
                pointer,
                schema,
                value
            });
        }
        return undefined;
    },
    minimum: (node, value) => {
        const { draft, schema, pointer } = node;
        if (isNaN(schema.minimum)) {
            return undefined;
        }
        if (schema.minimum > value) {
            return draft.errors.minimumError({
                minimum: schema.minimum,
                length: value,
                pointer,
                schema,
                value
            });
        }
        if (schema.exclusiveMinimum === true && schema.minimum === value) {
            return draft.errors.minimumError({
                minimum: schema.minimum,
                length: value,
                pointer,
                schema,
                value
            });
        }
        return undefined;
    },
    minItems: (node, value) => {
        const { draft, schema, pointer } = node;
        if (isNaN(schema.minItems)) {
            return undefined;
        }
        if (schema.minItems > value.length) {
            if (schema.minItems === 1) {
                return draft.errors.minItemsOneError({
                    minItems: schema.minItems,
                    length: value.length,
                    pointer,
                    schema,
                    value
                });
            }
            return draft.errors.minItemsError({
                minItems: schema.minItems,
                length: value.length,
                pointer,
                schema,
                value
            });
        }
        return undefined;
    },
    minProperties: (node, value) => {
        const { draft, schema, pointer } = node;
        if (isNaN(schema.minProperties)) {
            return undefined;
        }
        const propertyCount = Object.keys(value).length;
        if (schema.minProperties > propertyCount) {
            return draft.errors.minPropertiesError({
                minProperties: schema.minProperties,
                length: propertyCount,
                pointer,
                schema,
                value
            });
        }
        return undefined;
    },
    multipleOf: (node, value) => {
        const { draft, schema, pointer } = node;
        if (isNaN(schema.multipleOf) || typeof value !== "number") {
            return undefined;
        }
        const valuePrecision = getPrecision(value);
        const multiplePrecision = getPrecision(schema.multipleOf);
        if (valuePrecision > multiplePrecision) {
            // value with higher precision then multipleOf-precision can never be multiple
            return draft.errors.multipleOfError({
                multipleOf: schema.multipleOf,
                value,
                pointer,
                schema
            });
        }
        const precision = Math.pow(10, multiplePrecision);
        const val = Math.round(value * precision);
        const multiple = Math.round(schema.multipleOf * precision);
        if ((val % multiple) / precision !== 0) {
            return draft.errors.multipleOfError({
                multipleOf: schema.multipleOf,
                value,
                pointer,
                schema
            });
        }
        // maybe also check overflow
        // https://stackoverflow.com/questions/1815367/catch-and-compute-overflow-during-multiplication-of-two-large-integers
        return undefined;
    },
    not: (node, value) => {
        const { draft, schema, pointer } = node;
        const errors = [];
        if (draft.validate(node.next(schema.not), value).length === 0) {
            errors.push(draft.errors.notError({ value, not: schema.not, pointer, schema }));
        }
        return errors;
    },
    oneOf: validateOneOf,
    pattern: (node, value) => {
        const { draft, schema, pointer } = node;
        const pattern = new RegExp(schema.pattern, "u");
        if (pattern.test(value) === false) {
            return draft.errors.patternError({
                pattern: schema.pattern,
                description: schema.patternExample || schema.pattern,
                received: value,
                schema,
                value,
                pointer
            });
        }
        return undefined;
    },
    patternProperties: (node, value) => {
        const { draft, schema, pointer } = node;
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
            let patternFound = false;
            for (let i = 0, l = patterns.length; i < l; i += 1) {
                if (patterns[i].regex.test(key)) {
                    patternFound = true;
                    const valErrors = draft.validate(node.next(patterns[i].patternSchema, key), value[key]);
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
                errors.push(draft.errors.patternPropertiesError({
                    key,
                    pointer,
                    schema,
                    value,
                    patterns: Object.keys(pp).join(",")
                }));
            }
        });
        return errors;
    },
    properties: (node, value) => {
        const { draft, schema } = node;
        const errors = [];
        const keys = Object.keys(schema.properties || {});
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (hasProperty(value, key)) {
                const itemNode = draft.step(node, key, value);
                if (isJsonError(itemNode)) {
                    errors.push(itemNode);
                }
                else {
                    const keyErrors = draft.validate(itemNode, value[key]);
                    errors.push(...keyErrors);
                }
            }
        }
        return errors;
    },
    // @todo move to separate file: this is custom keyword validation for JsonEditor.properties keyword
    propertiesRequired: (node, value) => {
        const { draft, schema, pointer } = node;
        const errors = [];
        const keys = Object.keys(schema.properties || {});
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (value[key] === undefined) {
                errors.push(draft.errors.requiredPropertyError({ key, pointer, schema, value }));
            }
            else {
                const itemNode = draft.step(node, key, value);
                const keyErrors = draft.validate(itemNode, value[key]);
                errors.push(...keyErrors);
            }
        }
        return errors;
    },
    required: (node, value) => {
        const { draft, schema, pointer } = node;
        if (Array.isArray(schema.required) === false) {
            return undefined;
        }
        return schema.required.map((property) => {
            if (!hasProperty(value, property)) {
                return draft.errors.requiredPropertyError({
                    key: property,
                    pointer,
                    schema,
                    value
                });
            }
            return undefined;
        });
    },
    // @todo move to separate file: this is custom keyword validation for JsonEditor.required keyword
    requiredNotEmpty: (node, value) => {
        const { schema } = node;
        if (Array.isArray(schema.required) === false) {
            return undefined;
        }
        return schema.required.map((property) => {
            const { draft, schema, pointer } = node;
            if (value[property] == null || value[property] === "") {
                return draft.errors.valueNotEmptyError({
                    property,
                    pointer: `${pointer}/${property}`,
                    schema,
                    value
                });
            }
            return undefined;
        });
    },
    uniqueItems: (node, value) => {
        const { draft, schema, pointer } = node;
        if ((Array.isArray(value) && schema.uniqueItems) === false) {
            return undefined;
        }
        const duplicates = [];
        const errors = [];
        value.forEach((item, index) => {
            for (let i = index + 1; i < value.length; i += 1) {
                if (deepEqual(item, value[i]) && !duplicates.includes(i)) {
                    errors.push(draft.errors.uniqueItemsError({
                        pointer: `${pointer}/${i}`,
                        duplicatePointer: `${pointer}/${index}`,
                        arrayPointer: pointer,
                        value: JSON.stringify(item),
                        schema
                    }));
                    duplicates.push(i);
                }
            }
        });
        return errors;
    }
};
export default KeywordValidation;
