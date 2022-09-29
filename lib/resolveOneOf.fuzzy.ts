import { errorOrPromise } from "./utils/filter";
import flattenArray from "./utils/flattenArray";
import getTypeOf from "./getTypeOf";
import settings from "./config/settings";
import { JSONSchema, JSONPointer, JSONError, isJSONError } from "./types";
import { Draft as Core } from "./draft";

const { DECLARATOR_ONEOF } = settings;

/**
 * Returns a ranking for the data and given schema
 *
 * @param core
 * @param - json schema type: object
 * @param data
 * @param [pointer]
 * @return ranking value (higher is better)
 */
function fuzzyObjectValue(
    core: Core,
    one: JSONSchema,
    data: { [p: string]: any },
    pointer?: JSONPointer
) {
    if (data == null || one.properties == null) {
        return -1;
    }

    let value = 0;
    const keys = Object.keys(one.properties);
    for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (data[key] != null && core.isValid(data[key], one.properties[key], pointer)) {
            value += 1;
        }
    }

    return value;
}

/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param core
 * @param data
 * @param [schema] - current json schema containing property oneOf
 * @param [pointer] - json pointer to data
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

    // keyword: oneOf
    const matches = [];
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = core.resolveRef(schema.oneOf[i]);
        if (core.isValid(data, one, pointer)) {
            matches.push(one);
        }
    }

    if (matches.length === 1) {
        return matches[0];
    }

    // fuzzy match oneOf
    if (getTypeOf(data) === "object") {
        let schemaOfItem;
        let fuzzyGreatest = 0;

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = core.resolveRef(schema.oneOf[i]);
            const fuzzyValue = fuzzyObjectValue(core, one, data);

            if (fuzzyGreatest < fuzzyValue) {
                fuzzyGreatest = fuzzyValue;
                schemaOfItem = schema.oneOf[i];
            }
        }

        if (schemaOfItem === undefined) {
            return core.errors.oneOfError({
                value: JSON.stringify(data),
                pointer,
                oneOf: schema.oneOf
            });
        }

        return schemaOfItem;
    }

    if (matches.length > 1) {
        return core.errors.multipleOneOfError({ matches, data, pointer });
    }

    return core.errors.oneOfError({ value: JSON.stringify(data), pointer, oneOf: schema.oneOf });
}
