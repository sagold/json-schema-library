import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { isBooleanSchema, isJsonSchema, SchemaNode } from "../types";
import { isValid } from "../validateNode";

const KEYWORD = "not";

export const notKeyword: Keyword<"not"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseNot,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validateNot
};

export function parseNot(node: SchemaNode) {
    const { schema, evaluationPath, schemaLocation } = node;
    const not = schema[KEYWORD];
    if (not == null) {
        return;
    }
    if (!isJsonSchema(not) && !isBooleanSchema(not)) {
        return node.createError("schema-error", {
            pointer: `${schemaLocation}/${KEYWORD}`,
            schema,
            value: not,
            message: `Keyword '${KEYWORD}' must be a valid JSON Schema - received '${typeof not}'`
        });
    }
    node[KEYWORD] = node.compileSchema(schema[KEYWORD], `${evaluationPath}/not`, `${schemaLocation}/not`);
    return node[KEYWORD].schemaValidation;
}

function validateNot({ node, data, pointer, path }: JsonSchemaValidatorParams<"not">) {
    const { schema } = node;
    // not has been tested in addValidate
    if (isValid(node[KEYWORD]!, data, pointer, path)) {
        return node.createError("not-error", { value: data, not: schema[KEYWORD], pointer, schema });
    }
}
