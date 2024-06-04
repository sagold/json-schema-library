import getTypeOf from "./getTypeOf";
import createSchemaOf from "./createSchemaOf";
import { JsonSchema, JsonPointer, JsonError, isJsonError } from "./types";
import { Draft } from "./draft";
import { reduceSchema } from "./reduceSchema";

type StepFunction = (
    draft: Draft,
    key: string,
    schema: JsonSchema,
    data: any,
    pointer: JsonPointer
) => JsonSchema | JsonError | undefined;

const stepType: Record<string, StepFunction> = {
    array: (draft, key, schema, data, pointer) => {
        const itemValue = data?.[key];
        const itemsType = getTypeOf(schema.items);

        if (itemsType === "object") {
            // @spec: ignore additionalItems, when items is schema-object
            return (
                reduceSchema(draft, schema.items, itemValue, `${pointer}/${key}`) ||
                draft.resolveRef(schema.items)
            );
        }

        if (itemsType === "array") {
            // @draft >= 7 bool schema, items:[true, false]
            if (schema.items[key] === true) {
                return createSchemaOf(itemValue);
            }
            // @draft >= 7 bool schema, items:[true, false]
            if (schema.items[key] === false) {
                return draft.errors.invalidDataError({
                    key,
                    value: itemValue,
                    pointer,
                    schema
                });
            }

            if (schema.items[key]) {
                return draft.resolveRef(schema.items[key]);
            }

            if (schema.additionalItems === false) {
                return draft.errors.additionalItemsError({
                    key,
                    value: itemValue,
                    pointer,
                    schema
                });
            }

            if (schema.additionalItems === true || schema.additionalItems === undefined) {
                return createSchemaOf(itemValue);
            }

            if (getTypeOf(schema.additionalItems) === "object") {
                return schema.additionalItems;
            }

            throw new Error(
                `Invalid schema ${JSON.stringify(schema, null, 2)} for ${JSON.stringify(
                    data,
                    null,
                    2
                )}`
            );
        }

        if (schema.additionalItems !== false && itemValue) {
            // @todo reevaluate: incomplete schema is created here
            // @todo support additionalItems: {schema}
            return createSchemaOf(itemValue);
        }

        return new Error(`Invalid array schema for ${key} at ${pointer}`) as JsonError;
    },

    object: (draft, key, schema, data, pointer) => {
        schema = reduceSchema(draft, schema, data, pointer);

        // @feature properties
        const property = schema?.properties?.[key];
        if (property !== undefined) {
            // @todo patternProperties also validate properties

            // @feature boolean schema
            if (property === false) {
                return draft.errors.forbiddenPropertyError({
                    property: key,
                    value: data,
                    pointer,
                    schema
                });
            } else if (property === true) {
                return createSchemaOf(data?.[key]);
            }

            const targetSchema = draft.resolveRef(property);
            if (isJsonError(targetSchema)) {
                return targetSchema;
            }

            // check if there is a oneOf selection, which must be resolved
            if (targetSchema && Array.isArray(targetSchema.oneOf)) {
                // @special case: this is a mix of a schema and optional definitions
                // we resolve the schema here and add the original schema to `oneOfSchema`
                const resolvedSchema = draft.resolveOneOf(
                    data[key],
                    targetSchema,
                    `${pointer}/${key}`
                );
                for (const p in targetSchema) {
                    if (p !== "oneOf" && resolvedSchema[p] === undefined) {
                        resolvedSchema[p] = targetSchema[p];
                    }
                }
                return resolvedSchema;
            }

            // resolved schema or error
            if (targetSchema) {
                return targetSchema;
            }
        }

        // @feature patternProperties
        const { patternProperties } = schema;
        if (getTypeOf(patternProperties) === "object") {
            // find matching property key
            let regex;
            const patterns = Object.keys(patternProperties);
            for (let i = 0, l = patterns.length; i < l; i += 1) {
                regex = new RegExp(patterns[i]);
                if (regex.test(key)) {
                    return patternProperties[patterns[i]];
                }
            }
        }

        // @feature additionalProperties
        const { additionalProperties } = schema;
        if (getTypeOf(additionalProperties) === "object") {
            return schema.additionalProperties;
        }
        if (data && (additionalProperties === undefined || additionalProperties === true)) {
            return createSchemaOf(data[key]);
        }

        return draft.errors.unknownPropertyError({
            property: key,
            value: data,
            pointer: `${pointer}`,
            schema
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
    const typeOfData = getTypeOf(data);
    let schemaType = schema.type ?? typeOfData;

    // @draft >= 4 ?
    if (Array.isArray(schemaType)) {
        if (!schemaType.includes(typeOfData)) {
            return draft.errors.typeError({
                value: data,
                pointer,
                expected: schema.type,
                received: typeOfData,
                schema
            });
        }
        schemaType = typeOfData;
    }

    const stepFunction = stepType[schemaType];
    if (stepFunction) {
        const schemaResult = stepFunction(draft, `${key}`, schema, data, pointer);
        if (schemaResult === undefined) {
            return draft.errors.schemaWarning({
                pointer,
                value: data,
                schema,
                key
            });
        }
        return schemaResult;
    }

    return new Error(`Unsupported schema type ${schema.type} for key ${key}`) as JsonError;
}
