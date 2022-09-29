import { errorOrPromise } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import settings from "./config/settings";
import { JSONSchema, JSONPointer, JSONError, isJSONError } from "./types";
import { Draft as Core } from "./draft";

const { DECLARATOR_ONEOF } = settings;

/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param core - validator
 * @param data
 * @param schema - current json schema containing property oneOf
 * @param pointer - json pointer to data
 * @return oneOf schema or an error
 */
export default function resolveOneOf(
    core: Core,
    data: any,
    schema: JSONSchema = core.rootSchema,
    pointer: JSONPointer = "#"
): JSONSchema | JSONError {
    // !keyword: oneOfProperty
    // an additional <DECLARATOR_ONEOF> (default `oneOfProperty`) on the schema will exactly determine the
    // oneOf value (if set in data)

    // @fixme
    // abort if no data is given an DECLARATOR_ONEOF is set (used by getChildSchemaSelection)
    // this case (data != null) should not be necessary
    if (data != null && schema[DECLARATOR_ONEOF]) {
        const errors = [];
        const oneOfProperty = schema[DECLARATOR_ONEOF];
        const oneOfValue = data[schema[DECLARATOR_ONEOF]];

        if (oneOfValue === undefined) {
            return core.errors.missingOneOfPropertyError({ property: oneOfProperty, pointer });
        }

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = core.resolveRef(schema.oneOf[i]);
            const oneOfPropertySchema = core.step(oneOfProperty, one, data, pointer);

            if (isJSONError(oneOfPropertySchema)) {
                return oneOfPropertySchema;
            }

            let result = flattenArray(core.validate(oneOfValue, oneOfPropertySchema, pointer));
            result = result.filter(errorOrPromise);

            if (result.length > 0) {
                errors.push(...result);
            } else {
                return one; // return resolved schema
            }
        }

        return core.errors.oneOfPropertyError({
            property: oneOfProperty,
            value: oneOfValue,
            pointer,
            errors
        });
    }

    const matches = [];
    const errors = [];
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = core.resolveRef(schema.oneOf[i]);

        let result = flattenArray(core.validate(data, one, pointer));
        result = result.filter(errorOrPromise);

        if (result.length > 0) {
            errors.push(...result);
        } else {
            matches.push(one);
        }
    }

    if (matches.length === 1) {
        return matches[0];
    }
    if (matches.length > 1) {
        return core.errors.multipleOneOfError({
            value: data,
            pointer,
            matches
        });
    }

    return core.errors.oneOfError({
        value: JSON.stringify(data),
        pointer,
        oneOf: schema.oneOf,
        errors
    });
}
