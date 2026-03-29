import { mergeSchema } from "../utils/mergeSchema";
import {
    Keyword,
    JsonSchemaReducerParams,
    JsonSchemaValidatorParams,
    ValidationReturnType,
    ValidationAnnotation
} from "../Keyword";
import { SchemaNode } from "../types";
import { validateNode } from "../validateNode";

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

    return node[KEYWORD].reduce((errors, node) => {
        if (node.schemaValidation) errors.push(...node.schemaValidation);
        return errors;
    }, [] as ValidationAnnotation[]);
}

function reduceAllOf({ node, data, key, pointer, path }: JsonSchemaReducerParams) {
    if (node[KEYWORD] == null) {
        return;
    }

    // note: parts of schemas could be merged, e.g. if they do not include
    // dynamic schema parts
    let mergedSchema = {};
    let dynamicId = "";
    for (let i = 0; i < node[KEYWORD].length; i += 1) {
        const { node: schemaNode } = node[KEYWORD][i].reduceNode(data, { key, pointer, path });
        if (schemaNode) {
            const nestedDynamicId = schemaNode.dynamicId?.replace(node.dynamicId, "") ?? "";
            const localDynamicId = nestedDynamicId === "" ? `${KEYWORD}/${i}` : nestedDynamicId;
            dynamicId += `${dynamicId === "" ? "" : ","}${localDynamicId}`;

            const schema = mergeSchema(node[KEYWORD][i].schema, schemaNode.schema);
            mergedSchema = mergeSchema(mergedSchema, schema, KEYWORD, "contains");
        }
    }

    return node.compileSchema(
        mergedSchema,
        `${node.evaluationPath}/${dynamicId}`,
        node.schemaLocation,
        `${node.schemaLocation}(${dynamicId})`
    );
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
