import { isObject } from "../utils/isObject";
import { isBooleanSchema, isJsonSchema, SchemaNode } from "../types";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { validateNode } from "../validateNode";

const KEYWORD = "contains";

export const containsKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseContains,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateContains,
    addReduce: (node) => node[KEYWORD] != null,
    reduce: ({ node }) => {
        return node.compileSchema(
            {
                items: {
                    anyOf: [node[KEYWORD]!.schema] // we tested for contains in addReduce
                }
            },
            node.evaluationPath,
            node.schemaLocation
        );
    }
};

export function parseContains(node: SchemaNode) {
    const contains = node.schema[KEYWORD];
    if (contains == null) {
        return;
    }
    if (!(isJsonSchema(contains) || isBooleanSchema(contains))) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: contains,
            message: `Keyword '${KEYWORD}' must be a valid JSON Schema - received '${typeof contains}'`
        });
    }

    node[KEYWORD] = node.compileSchema(contains, `${node.evaluationPath}/${KEYWORD}`);
    return node[KEYWORD].schemaValidation;
}

function validateContains({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (!Array.isArray(data)) {
        return;
    }
    if (schema.contains === false) {
        return node.createError("contains-array-error", { pointer, value: data, schema });
    }

    if (schema.contains === true) {
        if (Array.isArray(data) && data.length === 0) {
            return node.createError("contains-any-error", { pointer, value: data, schema });
        }
        return undefined;
    }

    if (!isObject(schema.contains) || !Array.isArray(data)) {
        // - ignore invalid schema
        // - ignore invalid dara
        return undefined;
    }

    let count = 0;
    for (const d of data) {
        // we tested for contains in addValidate
        if (validateNode(node.contains!, d, pointer, path).length === 0) {
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
        return node.createError("contains-max-error", { pointer, schema, delta: count - max, value: data });
    }
    if (min > count) {
        return node.createError("contains-min-error", { pointer, schema, delta: min - count, value: data });
    }
    return node.createError("contains-error", { pointer, schema, value: data });
}
