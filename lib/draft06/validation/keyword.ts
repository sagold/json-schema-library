import Keywords from "../../validation/keyword";
import getTypeOf from "../../getTypeOf";
import { JSONValidator, JSONError } from "../../types";

const KeywordValidation: Record<string, JSONValidator> = {
    ...Keywords,
    // @draft >= 6
    contains: (core, schema, value: unknown[], pointer) => {
        if (schema.contains === false) {
            return core.errors.containsArrayError({ pointer, value });
        }

        if (schema.contains === true) {
            if (Array.isArray(value) && value.length === 0) {
                return core.errors.containsAnyError({ pointer });
            }
            return undefined;
        }

        if (getTypeOf(schema.contains) !== "object") {
            // ignore invalid schema
            return undefined;
        }

        for (let i = 0; i < value.length; i += 1) {
            if (core.isValid(value[i], schema.contains)) {
                return undefined;
            }
        }
        return core.errors.containsError({ pointer, schema: JSON.stringify(schema.contains) });
    },
    exclusiveMaximum: (core, schema, value, pointer) => {
        if (isNaN(schema.exclusiveMaximum)) {
            return undefined;
        }
        if (schema.exclusiveMaximum <= value) {
            return core.errors.maximumError({
                maximum: schema.exclusiveMaximum,
                length: value,
                pointer
            });
        }
        return undefined;
    },
    exclusiveMinimum: (core, schema, value, pointer) => {
        if (isNaN(schema.exclusiveMinimum)) {
            return undefined;
        }
        if (schema.exclusiveMinimum >= value) {
            return core.errors.minimumError({
                minimum: schema.exclusiveMinimum,
                length: value,
                pointer
            });
        }
        return undefined;
    },
    if: (core, schema, value, pointer) => {
        if (schema.if == null) {
            return undefined;
        }

        const ifErrors = core.validate(value, schema.if, pointer);
        // console.log("if Errors", value, ifErrors);

        if (ifErrors.length === 0 && schema.then) {
            return core.validate(value, schema.then, pointer);
        }

        if (ifErrors.length !== 0 && schema.else) {
            return core.validate(value, schema.else, pointer);
        }
    },
    maximum: (core, schema, value, pointer) => {
        if (isNaN(schema.maximum)) {
            return undefined;
        }
        if (schema.maximum && schema.maximum < value) {
            return core.errors.maximumError({ maximum: schema.maximum, length: value, pointer });
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
        return undefined;
    },
    patternProperties: (core, schema, value: Record<string, unknown>, pointer) => {
        const properties = schema.properties || {};
        const pp = schema.patternProperties;
        if (getTypeOf(pp) !== "object") {
            return undefined;
        }

        const errors: JSONError[] = [];
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

                    // for a boolean schema `false`, always invalidate
                    if (patterns[i].patternSchema === false) {
                        errors.push(
                            core.errors.patternPropertiesError({
                                key,
                                pointer,
                                patterns: Object.keys(pp).join(",")
                            })
                        );
                        return;
                    }

                    const valErrors = core.validate(
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
                    core.errors.patternPropertiesError({
                        key,
                        pointer,
                        patterns: Object.keys(pp).join(",")
                    })
                );
            }
        });

        return errors;
    },
    // @draft >= 6
    propertyNames: (core, schema, value: Record<string, unknown>, pointer) => {
        // bool schema
        if (schema.propertyNames === false) {
            // empty objects are valid
            if (Object.keys(value).length === 0) {
                return undefined;
            }
            return core.errors.invalidPropertyNameError({
                property: Object.keys(value),
                pointer,
                value
            });
        }

        if (schema.propertyNames === true) {
            return undefined;
        }

        if (getTypeOf(schema.propertyNames) !== "object") {
            // ignore invalid schema
            return undefined;
        }

        const errors: JSONError[] = [];
        const properties = Object.keys(value);
        const propertySchema = { ...schema.propertyNames, type: "string" };
        properties.forEach((prop) => {
            const validationResult = core.validate(prop, propertySchema, `${pointer}/${prop}`);
            if (validationResult.length > 0) {
                errors.push(
                    core.errors.invalidPropertyNameError({
                        property: prop,
                        pointer,
                        validationError: validationResult[0],
                        value: value[prop]
                    })
                );
            }
        });

        return errors;
    }
};

export default KeywordValidation;
