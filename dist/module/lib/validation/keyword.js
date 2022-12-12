import getTypeOf from "../getTypeOf";
import isSame from "../utils/deepCompare";
import settings from "../config/settings";
import ucs2decode from "../utils/punycode.ucs2decode";
import { isJSONError } from "../types";
const FPP = settings.floatingPointPrecision;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasProperty = (value, property) => !(value[property] === undefined || !hasOwnProperty.call(value, property));
// list of validation keywords: http://json-schema.org/latest/json-schema-validation.html#rfc.section.5
const KeywordValidation = {
    additionalProperties: (core, schema, value, pointer) => {
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
                const isObject = typeof schema.additionalProperties === "object";
                // additionalProperties { oneOf: [] }
                if (isObject && Array.isArray(schema.additionalProperties.oneOf)) {
                    const result = core.resolveOneOf(value[property], schema.additionalProperties, `${pointer}/${property}`);
                    if (isJSONError(result)) {
                        errors.push(core.errors.additionalPropertiesError({
                            schema: schema.additionalProperties,
                            property: receivedProperties[i],
                            properties: expectedProperties,
                            pointer,
                            // pass all validation errors
                            errors: result.data.errors
                        }));
                    }
                    else {
                        errors.push(...core.validate(value[property], result, pointer));
                    }
                    // additionalProperties {}
                }
                else if (isObject) {
                    errors.push(...core.validate(value[property], schema.additionalProperties, `${pointer}/${property}`));
                }
                else {
                    errors.push(core.errors.noAdditionalPropertiesError({
                        property: receivedProperties[i],
                        properties: expectedProperties,
                        pointer
                    }));
                }
            }
        }
        return errors;
    },
    allOf: (core, schema, value, pointer) => {
        if (Array.isArray(schema.allOf) === false) {
            return undefined;
        }
        const errors = [];
        schema.allOf.forEach((subSchema) => {
            errors.push(...core.validate(value, subSchema, pointer));
        });
        return errors;
    },
    anyOf: (core, schema, value, pointer) => {
        if (Array.isArray(schema.anyOf) === false) {
            return undefined;
        }
        for (let i = 0; i < schema.anyOf.length; i += 1) {
            if (core.isValid(value, schema.anyOf[i])) {
                return undefined;
            }
        }
        return core.errors.anyOfError({ anyOf: schema.anyOf, value, pointer });
    },
    dependencies: (core, schema, value, pointer) => {
        if (getTypeOf(schema.dependencies) !== "object") {
            return undefined;
        }
        const errors = [];
        Object.keys(value).forEach((property) => {
            if (schema.dependencies[property] === undefined) {
                return;
            }
            // @draft >= 6 boolean schema
            if (schema.dependencies[property] === true) {
                return;
            }
            if (schema.dependencies[property] === false) {
                errors.push(core.errors.missingDependencyError({ pointer }));
                return;
            }
            let dependencyErrors;
            const type = getTypeOf(schema.dependencies[property]);
            if (type === "array") {
                dependencyErrors = schema.dependencies[property]
                    .filter((dependency) => value[dependency] === undefined)
                    .map((missingProperty) => core.errors.missingDependencyError({ missingProperty, pointer }));
            }
            else if (type === "object") {
                dependencyErrors = core.validate(value, schema.dependencies[property], pointer);
            }
            else {
                throw new Error(`Invalid dependency definition for ${pointer}/${property}. Must be list or schema`);
            }
            errors.push(...dependencyErrors);
        });
        return errors.length > 0 ? errors : undefined;
    },
    enum: (core, schema, value, pointer) => {
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
        return core.errors.enumError({ values: schema.enum, value, pointer });
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
        // @draft >= 7 bool schema
        if (schema.items === false) {
            if (Array.isArray(value) && value.length === 0) {
                return undefined;
            }
            return core.errors.invalidDataError({ pointer, value });
        }
        const errors = [];
        for (let i = 0; i < value.length; i += 1) {
            const itemData = value[i];
            // @todo reevaluate: incomplete schema is created here
            const itemSchema = core.step(i, schema, value, pointer);
            if (isJSONError(itemSchema)) {
                return [itemSchema];
            }
            const itemErrors = core.validate(itemData, itemSchema, `${pointer}/${i}`);
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
            return core.errors.maxItemsError({
                maximum: schema.maxItems,
                length: value.length,
                pointer
            });
        }
        return undefined;
    },
    maxLength: (core, schema, value, pointer) => {
        if (isNaN(schema.maxLength)) {
            return undefined;
        }
        const lengthOfString = ucs2decode(value).length;
        if (schema.maxLength < lengthOfString) {
            return core.errors.maxLengthError({
                maxLength: schema.maxLength,
                length: lengthOfString,
                pointer
            });
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
        const lengthOfString = ucs2decode(value).length;
        if (schema.minLength > lengthOfString) {
            if (schema.minLength === 1) {
                return core.errors.minLengthOneError({
                    minLength: schema.minLength,
                    length: lengthOfString,
                    pointer
                });
            }
            return core.errors.minLengthError({
                minLength: schema.minLength,
                length: lengthOfString,
                pointer
            });
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
            if (schema.minItems === 1) {
                return core.errors.minItemsOneError({
                    minItems: schema.minItems,
                    length: value.length,
                    pointer
                });
            }
            return core.errors.minItemsError({
                minItems: schema.minItems,
                length: value.length,
                pointer
            });
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
                length: propertyCount,
                pointer
            });
        }
        return undefined;
    },
    multipleOf: (core, schema, value, pointer) => {
        if (isNaN(schema.multipleOf)) {
            return undefined;
        }
        // https://github.com/cfworker/cfworker/blob/master/packages/json-schema/src/validate.ts#L1061
        // https://github.com/ExodusMovement/schemasafe/blob/master/src/compile.js#L441
        if (((value * FPP) % (schema.multipleOf * FPP)) / FPP !== 0) {
            return core.errors.multipleOfError({ multipleOf: schema.multipleOf, value, pointer });
        }
        // also check https://stackoverflow.com/questions/1815367/catch-and-compute-overflow-during-multiplication-of-two-large-integers
        return undefined;
    },
    not: (core, schema, value, pointer) => {
        const errors = [];
        if (core.validate(value, schema.not, pointer).length === 0) {
            errors.push(core.errors.notError({ value, not: schema.not, pointer }));
        }
        return errors;
    },
    oneOf: (core, schema, value, pointer) => {
        if (Array.isArray(schema.oneOf) === false) {
            return undefined;
        }
        schema = core.resolveOneOf(value, schema, pointer);
        if (isJSONError(schema)) {
            return schema;
        }
        return undefined;
    },
    pattern: (core, schema, value, pointer) => {
        const pattern = new RegExp(schema.pattern, "u");
        if (pattern.test(value) === false) {
            return core.errors.patternError({
                pattern: schema.pattern,
                description: schema.patternExample || schema.pattern,
                received: value,
                pointer
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
            let patternFound = false;
            for (let i = 0, l = patterns.length; i < l; i += 1) {
                if (patterns[i].regex.test(key)) {
                    patternFound = true;
                    const valErrors = core.validate(value[key], patterns[i].patternSchema, `${pointer}/${key}`);
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
                errors.push(core.errors.patternPropertiesError({
                    key,
                    pointer,
                    patterns: Object.keys(pp).join(",")
                }));
            }
        });
        return errors;
    },
    properties: (core, schema, value, pointer) => {
        const errors = [];
        const keys = Object.keys(schema.properties || {});
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (hasProperty(value, key)) {
                const itemSchema = core.step(key, schema, value, pointer);
                const keyErrors = core.validate(value[key], itemSchema, `${pointer}/${key}`);
                errors.push(...keyErrors);
            }
        }
        return errors;
    },
    // @todo move to separate file: this is custom keyword validation for JsonEditor.properties keyword
    propertiesRequired: (core, schema, value, pointer) => {
        const errors = [];
        const keys = Object.keys(schema.properties || {});
        for (let i = 0; i < keys.length; i += 1) {
            const key = keys[i];
            if (value[key] === undefined) {
                errors.push(core.errors.requiredPropertyError({ key, pointer }));
            }
            else {
                const itemSchema = core.step(key, schema, value, pointer);
                const keyErrors = core.validate(value[key], itemSchema, `${pointer}/${key}`);
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
            if (!hasProperty(value, property)) {
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
                return core.errors.valueNotEmptyError({
                    property,
                    pointer: `${pointer}/${property}`
                });
            }
            return undefined;
        });
    },
    uniqueItems: (core, schema, value, pointer) => {
        if ((Array.isArray(value) && schema.uniqueItems) === false) {
            return undefined;
        }
        const errors = [];
        value.forEach((item, index) => {
            for (let i = index + 1; i < value.length; i += 1) {
                if (isSame(item, value[i])) {
                    errors.push(core.errors.uniqueItemsError({
                        pointer,
                        itemPointer: `${pointer}/${index}`,
                        duplicatePointer: `${pointer}/${i}`,
                        value: JSON.stringify(item)
                    }));
                }
            }
        });
        return errors;
    }
};
export default KeywordValidation;
