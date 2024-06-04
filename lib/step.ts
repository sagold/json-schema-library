import getTypeOf from "./getTypeOf";
import createSchemaOf from "./createSchemaOf";
import { JsonSchema, JsonError, isJsonError } from "./types";
import { SchemaNode } from "./schemaNode";
import { reduceSchema } from "./reduceSchema";
import { mergeSchema } from "./mergeSchema";

type StepFunction = (
    node: SchemaNode,
    key: string,
    data: any
) => SchemaNode | JsonError | undefined;

const stepType: Record<string, StepFunction> = {
    array: (node, key, data) => {
        const { draft, schema, pointer } = node;
        const itemValue = data?.[key];
        const itemsType = getTypeOf(schema.items);

        if (itemsType === "object") {
            // @spec: ignore additionalItems, when items is schema-object
            return reduceSchema(node.next(schema.items as JsonSchema, key), itemValue);
        }

        if (itemsType === "array") {
            // @draft >= 7 bool schema, items:[true, false]
            if (schema.items[key] === true) {
                return node.next(createSchemaOf(itemValue), key);
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
                return draft.resolveRef(node.next(schema.items[key] as JsonSchema, key));
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
                return node.next(createSchemaOf(itemValue), key);
            }

            if (getTypeOf(schema.additionalItems) === "object") {
                return node.next(schema.additionalItems, key);
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
            return node.next(createSchemaOf(itemValue), key);
        }

        return new Error(`Invalid array schema for ${key} at ${pointer}`) as JsonError;
    },

    object: (node, key, data) => {
        const { draft, pointer } = node;
        const reduction = reduceSchema(node, data);
        const schema = (reduction.schema ?? reduction) as JsonSchema;

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
                return node.next(createSchemaOf(data?.[key]), key);
            }

            const nextPropertyNode = draft.resolveRef(node.next(property as JsonSchema, key));
            if (isJsonError(nextPropertyNode)) {
                return nextPropertyNode;
            }
            // check if there is a oneOf selection, which must be resolved
            if (nextPropertyNode && Array.isArray(nextPropertyNode.schema.oneOf)) {
                // @special case: this is a mix of a schema and optional definitions
                // we resolve the schema here and add the original schema to `oneOfSchema`
                const nextNode = node.next(nextPropertyNode.schema, key);
                const result = draft.resolveOneOf(nextNode, data[key]);
                if (isJsonError(result)) {
                    return result;
                }
                return nextNode.merge(result.schema, "oneOf");
            }
            if (nextPropertyNode) {
                return nextPropertyNode;
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
                    return node.next(patternProperties[patterns[i]], key);
                }
            }
        }

        // @feature additionalProperties
        const { additionalProperties } = schema;
        if (getTypeOf(additionalProperties) === "object") {
            return node.next(schema.additionalProperties, key);
        }
        if (data && (additionalProperties === undefined || additionalProperties === true)) {
            const generatedSchema = createSchemaOf(data[key]);
            return generatedSchema ? node.next(generatedSchema, key) : undefined;
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
    node: SchemaNode,
    key: string | number,
    data?: any
): SchemaNode | JsonError {
    const { draft, schema, pointer } = node;
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
        const childNode = stepFunction(node, `${key}`, data);
        if (childNode === undefined) {
            return draft.errors.schemaWarning({ pointer, value: data, schema, key });
        }
        return childNode;
    }

    return new Error(`Unsupported schema type ${schema.type} for key ${key}`) as JsonError;
}
