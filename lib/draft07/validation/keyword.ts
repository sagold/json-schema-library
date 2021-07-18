import Keywords from "../../validation/keyword";
import getTypeOf from "../../getTypeOf";

const KeywordValidation = {
    ...Keywords,
    exclusiveMaximum: (core, schema, value, pointer) => {
        if (isNaN(schema.exclusiveMaximum)) {
            return undefined;
        }
        if (schema.exclusiveMaximum && schema.exclusiveMaximum <= value) {
            return core.errors.maximumError({ maximum: schema.exclusiveMaximum, length: value, pointer });
        }
        return undefined;
    },
    exclusiveMinimum: (core, schema, value, pointer) => {
        if (isNaN(schema.exclusiveMinimum)) {
            return undefined;
        }
        if (schema.exclusiveMinimum >= value) {
            return core.errors.minimumError({ minimum: schema.exclusiveMinimum, length: value, pointer });
        }
        return undefined;
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
    patternProperties: (core, schema, value, pointer) => {
        const properties = schema.properties || {};
        const pp = schema.patternProperties;
        if (getTypeOf(pp) !== "object") {
            return undefined;
        }

        const errors = [];
        const keys = Object.keys(value);
        const patterns = Object.keys(pp).map(expr => ({
            regex: new RegExp(expr),
            patternSchema: pp[expr]
        }));

        keys.forEach(key => {
            let patternFound = false;

            for (let i = 0, l = patterns.length; i < l; i += 1) {
                if (patterns[i].regex.test(key)) {
                    patternFound = true;

                    // for a boolean schema `false`, always invalidate
                    if (patterns[i].patternSchema === false) {
                        errors.push(core.errors.patternPropertiesError({
                            key, pointer, patterns: Object.keys(pp).join(",")
                        }));
                        return;
                    }

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
                    key, pointer, patterns: Object.keys(pp).join(",")
                }));
            }
        });

        return errors;
    }
}

export default KeywordValidation;
