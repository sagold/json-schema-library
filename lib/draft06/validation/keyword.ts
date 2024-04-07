import Keywords from "../../validation/keyword";
import getTypeOf from "../../getTypeOf";
import { JsonValidator, JsonError } from "../../types";
import { validateIf } from "../../features/if";
import Q from "../../Q";

const KeywordValidation: Record<string, JsonValidator> = {
    ...Keywords,
    // @draft >= 6
    contains: (draft, schema, value: unknown[], pointer) => {
        if (schema.contains === false) {
            return draft.errors.containsArrayError({ pointer, value, schema });
        }

        if (schema.contains === true) {
            if (Array.isArray(value) && value.length === 0) {
                return draft.errors.containsAnyError({ pointer, value, schema });
            }
            return undefined;
        }

        if (getTypeOf(schema.contains) !== "object") {
            // ignore invalid schema
            return undefined;
        }

        let count = 0;
        for (let i = 0; i < value.length; i += 1) {
            if (draft.isValid(value[i], Q.addScope(schema.contains, schema.__scope))) {
                count++;
            }
        }

        // @draft >= 2019-09
        const max = schema.maxContains ?? Infinity;
        const min = schema.minContains ?? 1;
        if (max >= count && min <= count) {
            return undefined;
        }
        if (max < count) {
            return draft.errors.containsMaxError({ pointer, schema, delta: count - max, value });
        }
        if (min > count) {
            return draft.errors.containsMinError({ pointer, schema, delta: min - count, value });
        }
        return draft.errors.containsError({ pointer, schema, value });
    },
    exclusiveMaximum: (draft, schema, value, pointer) => {
        if (isNaN(schema.exclusiveMaximum)) {
            return undefined;
        }
        if (schema.exclusiveMaximum <= value) {
            return draft.errors.maximumError({
                maximum: schema.exclusiveMaximum,
                length: value,
                pointer,
                schema,
                value
            });
        }
        return undefined;
    },
    exclusiveMinimum: (draft, schema, value, pointer) => {
        if (isNaN(schema.exclusiveMinimum)) {
            return undefined;
        }
        if (schema.exclusiveMinimum >= value) {
            return draft.errors.minimumError({
                minimum: schema.exclusiveMinimum,
                length: value,
                pointer,
                schema,
                value
            });
        }
        return undefined;
    },
    // @feature if-then-else
    if: validateIf,
    maximum: (draft, schema, value, pointer) => {
        if (isNaN(schema.maximum)) {
            return undefined;
        }
        if (schema.maximum && schema.maximum < value) {
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
    minimum: (draft, schema, value, pointer) => {
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

                    // for a boolean schema `false`, always invalidate
                    if (patterns[i].patternSchema === false) {
                        errors.push(
                            draft.errors.patternPropertiesError({
                                key,
                                pointer,
                                patterns: Object.keys(pp).join(","),
                                schema,
                                value
                            })
                        );
                        return;
                    }

                    const valErrors = draft.validate(
                        value[key],
                        Q.addScope(patterns[i].patternSchema, schema.__scope),
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
                        patterns: Object.keys(pp).join(","),
                        schema,
                        value
                    })
                );
            }
        });

        return errors;
    },
    // @draft >= 6
    propertyNames: (draft, schema, value: Record<string, unknown>, pointer) => {
        // bool schema
        if (schema.propertyNames === false) {
            // empty objects are valid
            if (Object.keys(value).length === 0) {
                return undefined;
            }
            return draft.errors.invalidPropertyNameError({
                property: Object.keys(value),
                pointer,
                value,
                schema
            });
        }

        if (schema.propertyNames === true) {
            return undefined;
        }

        if (getTypeOf(schema.propertyNames) !== "object") {
            // ignore invalid schema
            return undefined;
        }

        const errors: JsonError[] = [];
        const properties = Object.keys(value);
        const propertySchema = { ...schema.propertyNames, type: "string" };
        properties.forEach((prop) => {
            const validationResult = draft.validate(prop, Q.addScope(propertySchema, schema.__scope), `${pointer}/${prop}`);
            if (validationResult.length > 0) {
                errors.push(
                    draft.errors.invalidPropertyNameError({
                        property: prop,
                        pointer,
                        validationError: validationResult[0],
                        value: value[prop],
                        schema
                    })
                );
            }
        });

        return errors;
    }
};

export default KeywordValidation;
