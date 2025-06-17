import { mergeSchema } from "../utils/mergeSchema.js";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams } from "../Keyword.js";
import { SchemaNode } from "../types.js";
import { validateNode } from "../validateNode.js";

export const anyOfKeyword: Keyword = {
    id: "anyOf",
    keyword: "anyOf",
    parse: parseAnyOf,
    addReduce: (node) => node.anyOf != null,
    reduce: reduceAnyOf,
    addValidate: (node) => node.anyOf != null,
    validate: validateAnyOf
};

export function parseAnyOf(node: SchemaNode) {
    const { schema, evaluationPath, schemaLocation } = node;
    if (Array.isArray(schema.anyOf) && schema.anyOf.length) {
        node.anyOf = schema.anyOf.map((s, index) =>
            node.compileSchema(s, `${evaluationPath}/anyOf/${index}`, `${schemaLocation}/anyOf/${index}`)
        );
    }
}

function reduceAnyOf({ node, data, pointer, path }: JsonSchemaReducerParams) {
    if (node.anyOf == null) {
        return;
    }

    let mergedSchema = {};
    let dynamicId = "";
    for (let i = 0; i < node.anyOf.length; i += 1) {
        if (validateNode(node.anyOf[i], data, pointer, path).length === 0) {
            const { node: schemaNode } = node.anyOf[i].reduceNode(data);

            if (schemaNode) {
                const nestedDynamicId = schemaNode.dynamicId?.replace(node.dynamicId, "") ?? "";
                const localDynamicId = nestedDynamicId === "" ? `anyOf/${i}` : nestedDynamicId;
                dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;

                const schema = mergeSchema(node.anyOf[i].schema, schemaNode.schema);
                mergedSchema = mergeSchema(mergedSchema, schema, "anyOf");
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
    for (let i = 0; i < node.anyOf.length; i += 1) {
        if (validateNode(node.anyOf[i], data, pointer, path).length === 0) {
            return undefined;
        }
    }
    return node.createError("any-of-error", { pointer, schema: node.schema, value: data, anyOf: node.schema.anyOf });
}
