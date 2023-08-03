/**
 * @draft-04
 */
import flattenArray from "../utils/flattenArray";
import getTypeOf from "../getTypeOf";
import settings from "../config/settings";
import { createOneOfSchemaResult } from "../schema/createOneOfSchemaResult";
import { Draft } from "../draft";
import { errorOrPromise } from "../utils/filter";
import { JsonSchema, JsonPointer, JsonError, isJsonError, JsonValidator } from "../types";

const { DECLARATOR_ONEOF } = settings;

/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft - validator
 * @param data
 * @param schema - current json schema containing property oneOf
 * @param pointer - json pointer to data
 * @return oneOf schema or an error
 */
export function resolveOneOf(
    draft: Draft,
    data: any,
    schema: JsonSchema = draft.rootSchema,
    pointer: JsonPointer = "#"
): JsonSchema | JsonError {
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
            return draft.errors.missingOneOfPropertyError({
                property: oneOfProperty,
                pointer,
                schema,
                value: data
            });
        }

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = draft.resolveRef(schema.oneOf[i]);
            const oneOfPropertySchema = draft.step(oneOfProperty, one, data, pointer);

            if (isJsonError(oneOfPropertySchema)) {
                return oneOfPropertySchema;
            }

            let result = flattenArray(draft.validate(oneOfValue, oneOfPropertySchema, pointer));
            result = result.filter(errorOrPromise);

            if (result.length > 0) {
                errors.push(...result);
            } else {
                return createOneOfSchemaResult(schema, one, i); // return resolved schema
            }
        }

        return draft.errors.oneOfPropertyError({
            property: oneOfProperty,
            value: oneOfValue,
            pointer,
            schema,
            errors
        });
    }

    const matches = [];
    const errors = [];
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = draft.resolveRef(schema.oneOf[i]);

        let result = flattenArray(draft.validate(data, one, pointer));
        result = result.filter(errorOrPromise);

        if (result.length > 0) {
            errors.push(...result);
        } else {
            matches.push({ index: i, schema: one });
        }
    }

    if (matches.length === 1) {
        return createOneOfSchemaResult(schema, matches[0].schema, matches[0].index); // return resolved schema
    }
    if (matches.length > 1) {
        return draft.errors.multipleOneOfError({
            value: data,
            pointer,
            schema,
            matches
        });
    }

    return draft.errors.oneOfError({
        value: JSON.stringify(data),
        pointer,
        schema,
        oneOf: schema.oneOf,
        errors
    });
}

/**
 * Returns a ranking for the data and given schema
 *
 * @param draft
 * @param - json schema type: object
 * @param data
 * @param [pointer]
 * @return ranking value (higher is better)
 */
function fuzzyObjectValue(
    draft: Draft,
    one: JsonSchema,
    data: Record<string, unknown>,
    pointer?: JsonPointer
) {
    if (data == null || one.properties == null) {
        return -1;
    }

    let value = 0;
    const keys = Object.keys(one.properties);
    for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (data[key] != null && draft.isValid(data[key], one.properties[key], pointer)) {
            value += 1;
        }
    }

    return value;
}

/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft
 * @param data
 * @param [schema] - current json schema containing property oneOf
 * @param [pointer] - json pointer to data
 * @return oneOf schema or an error
 */
export function resolveOneOfFuzzy(
    draft: Draft,
    data: any,
    schema: JsonSchema = draft.rootSchema,
    pointer: JsonPointer = "#"
): JsonSchema | JsonError {
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
            return draft.errors.missingOneOfPropertyError({
                property: oneOfProperty,
                pointer,
                schema,
                value: data
            });
        }

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = draft.resolveRef(schema.oneOf[i]);
            const oneOfPropertySchema = draft.step(oneOfProperty, one, data, pointer);

            if (isJsonError(oneOfPropertySchema)) {
                return oneOfPropertySchema;
            }

            let result = flattenArray(draft.validate(oneOfValue, oneOfPropertySchema, pointer));
            result = result.filter(errorOrPromise);

            if (result.length > 0) {
                errors.push(...result);
            } else {
                return createOneOfSchemaResult(schema, one, i);
            }
        }

        return draft.errors.oneOfPropertyError({
            property: oneOfProperty,
            value: oneOfValue,
            pointer,
            schema,
            errors
        });
    }

    // keyword: oneOf
    const matches = [];
    for (let i = 0; i < schema.oneOf.length; i += 1) {
        const one = draft.resolveRef(schema.oneOf[i]);
        if (draft.isValid(data, one, pointer)) {
            matches.push({ schema: one, index: i });
        }
    }

    if (matches.length === 1) {
        return createOneOfSchemaResult(schema, matches[0].schema, matches[0].index);
    }

    // fuzzy match oneOf
    if (getTypeOf(data) === "object") {
        let schemaOfItem;
        let schemaOfIndex = -1;
        let fuzzyGreatest = 0;

        for (let i = 0; i < schema.oneOf.length; i += 1) {
            const one = draft.resolveRef(schema.oneOf[i]);
            const fuzzyValue = fuzzyObjectValue(draft, one, data);

            if (fuzzyGreatest < fuzzyValue) {
                fuzzyGreatest = fuzzyValue;
                schemaOfItem = schema.oneOf[i];
                schemaOfIndex = i;
            }
        }

        if (schemaOfItem === undefined) {
            return draft.errors.oneOfError({
                value: JSON.stringify(data),
                pointer,
                schema,
                oneOf: schema.oneOf
            });
        }

        return createOneOfSchemaResult(schema, schemaOfItem, schemaOfIndex);
    }

    if (matches.length > 1) {
        return draft.errors.multipleOneOfError({ matches, pointer, schema, value: data });
    }

    return draft.errors.oneOfError({
        value: JSON.stringify(data),
        pointer,
        schema,
        oneOf: schema.oneOf
    });
}

/**
 * validates oneOf definition for given input data
 */
const validateOneOf: JsonValidator = (draft, schema, value, pointer) => {
    if (Array.isArray(schema.oneOf)) {
        const schemaOrError = draft.resolveOneOf(value, schema, pointer);
        if (isJsonError(schemaOrError)) {
            return schemaOrError;
        }
    }
};

export { validateOneOf };
