import { mergeSchema } from "../utils/mergeSchema";
import { mergeNode, mergeReducedNode } from "../mergeNode";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationReturnType } from "../Keyword";
import { isBooleanSchema, SchemaNode } from "../types";
import { validateNode } from "../validateNode";
import { collectValidationErrors } from "src/utils/collectValidationErrors";

const KEYWORD = "allOf";

export const allOfKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseAllOf,
    addReduce: (node: SchemaNode) => node[KEYWORD] != null,
    reduce: reduceAllOf,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateAllOf
};

export function parseAllOf(node: SchemaNode) {
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
    return collectValidationErrors([], ...node[KEYWORD]);
}

function reduceAllOf({ node, data, key, pointer, path }: JsonSchemaReducerParams) {
    if (node[KEYWORD] == null) {
        return;
    }

    // note: parts of schemas could be merged, e.g. if they do not include
    // dynamic schema parts
    let mergedSchema = {};
    let mergedNode: SchemaNode | undefined;
    let dynamicId = "";
    for (let i = 0; i < node[KEYWORD].length; i += 1) {
        const { node: schemaNode } = node[KEYWORD][i].reduceNode(data, { key, pointer, path: [...path] });
        if (schemaNode) {
            const nestedDynamicId = schemaNode.dynamicId?.replace(node.dynamicId, "") ?? "";
            const localDynamicId = nestedDynamicId === "" ? `${KEYWORD}/${i}` : nestedDynamicId;
            dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;

            const reduced = isBooleanSchema(node[KEYWORD][i].schema) ? node[KEYWORD][i] : schemaNode;
            mergedSchema = mergeSchema(mergedSchema, reduced.schema, KEYWORD, "contains");
            mergedNode = mergeNode(mergedNode, reduced, KEYWORD, "contains");
        }
    }

    const result = node.compileSchema(
        mergedSchema,
        `${node.evaluationPath}/${dynamicId}`,
        node.schemaLocation,
        `${node.schemaLocation}(${dynamicId})`
    );
    return mergeReducedNode(result, mergedNode, KEYWORD, "contains");
}

function validateAllOf({ node, data, pointer, path }: JsonSchemaValidatorParams) {
    if (!Array.isArray(node[KEYWORD]) || node[KEYWORD].length === 0) {
        return;
    }
    const errors: ValidationReturnType = [];
    node[KEYWORD].forEach((allOfNode) => {
        errors.push(...validateNode(allOfNode, data, pointer, path));
    });
    return errors;
}
