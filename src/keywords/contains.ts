import { isObject } from "../utils/isObject.js";
import { SchemaNode } from "../types.js";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword.js";
import { validateNode } from "../validateNode.js";

export const containsKeyword: Keyword = {
    id: "contains",
    keyword: "contains",
    parse: parseContains,
    addValidate: (node) => node.contains != null,
    validate: validateContains,
    addReduce: (node) => node.contains != null,
    reduce: ({ node }) => {
        return node.compileSchema(
            {
                items: {
                    anyOf: [node.contains.schema]
                }
            },
            node.evaluationPath,
            node.schemaLocation
        );
    }
};

export function parseContains(node: SchemaNode) {
    const { schema, evaluationPath } = node;
    if (schema.contains == null) {
        return;
    }
    node.contains = node.compileSchema(schema.contains, `${evaluationPath}/contains`);
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
    for (let i = 0; i < data.length; i += 1) {
        if (validateNode(node.contains, data[i], pointer, path).length === 0) {
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
