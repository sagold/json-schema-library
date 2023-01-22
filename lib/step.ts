import getTypeOf from "./getTypeOf";
import createSchemaOf from "./createSchemaOf";
import errors from "./validation/errors";
import { JsonSchema, JsonPointer, JsonError, isJsonError } from "./types";
import { Draft } from "./draft";
import { reduceSchema } from "./reduceSchema";

type StepFunction = (
    draft: Draft,
    key: string,
    schema: JsonSchema,
    data: any,
    pointer: JsonPointer
) => JsonSchema | JsonError;

const stepType: Record<string, StepFunction> = {
    array: (draft, key, schema, data, pointer) => {
        const itemsType = getTypeOf(schema.items);

        if (itemsType === "object") {
            // oneOf
            if (Array.isArray(schema.items.oneOf)) {
                return draft.resolveOneOf(data[key], schema.items, pointer);
            }

            // anyOf
            if (Array.isArray(schema.items.anyOf)) {
                // schema of current object
                return draft.resolveAnyOf(data[key], schema.items, pointer);
            }

            // allOf
            if (Array.isArray(schema.items.allOf)) {
                return draft.resolveAllOf(data[key], schema.items);
            }

            // @spec: ignore additionalItems, when items is schema-object
            return draft.resolveRef(schema.items);
        }

        if (itemsType === "array") {
            // @draft >= 7 bool schema, items:[true, false]
            if (schema.items[key] === true) {
                return createSchemaOf(data[key]);
            }
            // @draft >= 7 bool schema, items:[true, false]
            if (schema.items[key] === false) {
                return errors.invalidDataError({
                    key,
                    value: data[key],
                    pointer
                });
            }

            if (schema.items[key]) {
                return draft.resolveRef(schema.items[key]);
            }

            if (schema.additionalItems === false) {
                return errors.additionalItemsError({
                    key,
                    value: data[key],
                    pointer
                });
            }

            if (schema.additionalItems === true || schema.additionalItems === undefined) {
                return createSchemaOf(data[key]);
            }

            if (getTypeOf(schema.additionalItems) === "object") {
                return schema.additionalItems;
            }

            throw new Error(
                `Invalid schema ${JSON.stringify(schema, null, 4)} for ${JSON.stringify(
                    data,
                    null,
                    4
                )}`
            );
        }

        if (schema.additionalItems !== false && data[key]) {
            // @todo reevaluate: incomplete schema is created here
            // @todo support additionalItems: {schema}
            return createSchemaOf(data[key]);
        }

        return new Error(`Invalid array schema for ${key} at ${pointer}`) as JsonError;
    },

    object: (draft, key, schema, data, pointer) => {
        schema = reduceSchema(draft, schema, data);

        // step into object-properties
        if (schema.properties && schema.properties[key] !== undefined) {
            // @todo patternProperties also validate properties

            // boolean schema
            if (schema.properties[key] === false) {
                return errors.forbiddenPropertyError({
                    property: key,
                    value: data,
                    pointer: `${pointer}`
                });
            } else if (schema.properties[key] === true) {
                return createSchemaOf(data?.[key]);
            }

            const targetSchema = draft.resolveRef(schema.properties[key]);
            if (isJsonError(targetSchema)) {
                return targetSchema;
            }

            // check if there is a oneOf selection, which must be resolved
            if (targetSchema && Array.isArray(targetSchema.oneOf)) {
                // @special case: this is a mix of a schema and optional definitions
                // we resolve the schema here and add the original schema to `oneOfSchema`
                return draft.resolveOneOf(data[key], targetSchema, `${pointer}/${key}`);
            }

            // resolved schema or error
            if (targetSchema) {
                return targetSchema;
            }
        }

        // find matching property key
        if (getTypeOf(schema.patternProperties) === "object") {
            let regex;
            const patterns = Object.keys(schema.patternProperties);
            for (let i = 0, l = patterns.length; i < l; i += 1) {
                regex = new RegExp(patterns[i]);
                if (regex.test(key)) {
                    return schema.patternProperties[patterns[i]];
                }
            }
        }

        if (getTypeOf(schema.additionalProperties) === "object") {
            return schema.additionalProperties;
        }

        if (
            data &&
            (schema.additionalProperties === undefined || schema.additionalProperties === true)
        ) {
            return createSchemaOf(data[key]);
        }

        return errors.unknownPropertyError({
            property: key,
            value: data,
            pointer: `${pointer}`
        });
    }
};

/**
 * Returns the json-schema of the given object property or array item.
 * e.g. it steps by one key into the data
 *
 *  This helper determines the location of the property within the schema (additional properties, oneOf, ...) and
 *  returns the correct schema.
 *
 * @param  draft      - validator
 * @param  key       - property-name or array-index
 * @param  schema    - json schema of current data
 * @param  data      - parent of key
 * @param  [pointer] - pointer to schema and data (parent of key)
 * @return Schema or Error if failed resolving key
 */
export default function step(
    draft: Draft,
    key: string | number,
    schema: JsonSchema,
    data?: any,
    pointer: JsonPointer = "#"
): JsonSchema | JsonError {
    // @draft >= 4 ?
    if (Array.isArray(schema.type)) {
        const dataType = getTypeOf(data);
        if (schema.type.includes(dataType)) {
            return stepType[dataType](draft, `${key}`, schema, data, pointer);
        }
        return draft.errors.typeError({
            value: data,
            pointer,
            expected: schema.type,
            received: dataType
        });
    }

    const expectedType = schema.type || getTypeOf(data);
    const stepFunction = stepType[expectedType];
    if (stepFunction) {
        return stepFunction(draft, `${key}`, schema, data, pointer);
    }
    return new Error(`Unsupported schema type ${schema.type} for key ${key}`) as JsonError;
}
