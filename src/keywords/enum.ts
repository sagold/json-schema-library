import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";
import { equalJson } from "../utils/equalJson";

const KEYWORD = "enum";

export const enumKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseEnum,
    addValidate: (node) => node.enum != null,
    validate: validateEnum
};

export function parseEnum(node: SchemaNode) {
    const { schema } = node;
    if (schema[KEYWORD] == null) {
        return;
    }
    if (!Array.isArray(schema[KEYWORD])) {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema,
            value: schema[KEYWORD],
            message: `Keyword '${KEYWORD}' must be an array - received '${typeof schema[KEYWORD]}'`
        });
    }
    node.enum = schema[KEYWORD];
}

function validateEnum({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    if (node.enum == null) {
        return;
    }
    if (node.enum.some((value) => equalJson(data, value))) {
        return undefined;
    }
    return node.createError("enum-error", {
        pointer,
        schema: node.schema,
        value: data,
        values: node.enum
    });
}
