import { mergeSchema } from "../utils/mergeSchema";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationAnnotation } from "../Keyword";
import { SchemaNode } from "../types";
import { validateNode } from "../validateNode";

const KEYWORD = "anyOf";

export const anyOfKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseAnyOf,
    addReduce: (node) => node[KEYWORD] != null,
    reduce: reduceAnyOf,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateAnyOf
};

export function parseAnyOf(node: SchemaNode) {
    const { schema, evaluationPath, schemaLocation } = node;
    if (schema[KEYWORD] == null) {
        return;
    }
    if (!Array.isArray(schema[KEYWORD])) {
        return node.createError("schema-error", {
            pointer: schemaLocation,
            schema,
            value: schema[KEYWORD],
            message: `Keyword '${KEYWORD}' must be an array - received '${typeof schema[KEYWORD]}'`
        });
    }
    if (schema[KEYWORD].length === 0) {
        return;
    }
    node[KEYWORD] = schema[KEYWORD].map((s, index) =>
        node.compileSchema(s, `${evaluationPath}/${KEYWORD}/${index}`, `${schemaLocation}/${KEYWORD}/${index}`)
    );

    return node[KEYWORD].reduce((errors, node) => {
        if (node.schemaValidation) errors.push(...node.schemaValidation);
        return errors;
    }, [] as ValidationAnnotation[]);
}

function reduceAnyOf({ node, data, pointer, path }: JsonSchemaReducerParams) {
    if (node[KEYWORD] == null) {
        return;
    }

    let mergedSchema = {};
    let dynamicId = "";
    for (let i = 0; i < node[KEYWORD].length; i += 1) {
        if (validateNode(node[KEYWORD][i], data, pointer, path).length === 0) {
            const { node: schemaNode } = node[KEYWORD][i].reduceNode(data);

            if (schemaNode) {
                const nestedDynamicId = schemaNode.dynamicId?.replace(node.dynamicId, "") ?? "";
                const localDynamicId = nestedDynamicId === "" ? `${KEYWORD}/${i}` : nestedDynamicId;
                dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;

                const schema = mergeSchema(node[KEYWORD][i].schema, schemaNode.schema);
                mergedSchema = mergeSchema(mergedSchema, schema, KEYWORD);
            }
        }
    }
    return node.compileSchema(
        mergedSchema,
        `${node.evaluationPath}${dynamicId}`,
        node.schemaLocation,
        `${node.schemaLocation}(${dynamicId})`
    );
}

function validateAnyOf({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    if (node[KEYWORD] == null) {
        return;
    }
    for (const anyOf of node[KEYWORD]) {
        if (validateNode(anyOf, data, pointer, path).length === 0) {
            return undefined;
        }
    }
    return node.createError("any-of-error", { pointer, schema: node.schema, value: data, anyOf: node.schema[KEYWORD] });
}
