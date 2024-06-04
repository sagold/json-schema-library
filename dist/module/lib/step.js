import getTypeOf from "./getTypeOf";
import createSchemaOf from "./createSchemaOf";
import { isJsonError } from "./types";
import { reduceSchema } from "./reduceSchema";
const stepType = {
    array: (node, key, data) => {
        const { draft, schema, pointer } = node;
        const itemValue = data === null || data === void 0 ? void 0 : data[key];
        const itemsType = getTypeOf(schema.items);
        if (itemsType === "object") {
            // @spec: ignore additionalItems, when items is schema-object
            return reduceSchema(node.next(schema.items, key), itemValue);
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
                return draft.resolveRef(node.next(schema.items[key], key));
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
            throw new Error(`Invalid schema ${JSON.stringify(schema, null, 2)} for ${JSON.stringify(data, null, 2)}`);
        }
        if (schema.additionalItems !== false && itemValue) {
            // @todo reevaluate: incomplete schema is created here
            // @todo support additionalItems: {schema}
            return node.next(createSchemaOf(itemValue), key);
        }
        return new Error(`Invalid array schema for ${key} at ${pointer}`);
    },
    object: (node, key, data) => {
        var _a, _b;
        const { draft, pointer } = node;
        const reduction = reduceSchema(node, data);
        const schema = ((_a = reduction.schema) !== null && _a !== void 0 ? _a : reduction);
        // @feature properties
        const property = (_b = schema === null || schema === void 0 ? void 0 : schema.properties) === null || _b === void 0 ? void 0 : _b[key];
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
            }
            else if (property === true) {
                return node.next(createSchemaOf(data === null || data === void 0 ? void 0 : data[key]), key);
            }
            const nextPropertyNode = draft.resolveRef(node.next(property, key));
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
export default function step(node, key, data) {
    var _a;
    const { draft, schema, pointer } = node;
    const typeOfData = getTypeOf(data);
    let schemaType = (_a = schema.type) !== null && _a !== void 0 ? _a : typeOfData;
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
    return new Error(`Unsupported schema type ${schema.type} for key ${key}`);
}
