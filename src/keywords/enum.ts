import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";
import { getTypeOf } from "../utils/getTypeOf";

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
    const type = getTypeOf(data);
    if (type === "object" || type === "array") {
        const valueStr = JSON.stringify(data);
        for (const e of node.enum) {
            if (JSON.stringify(e) === valueStr) {
                return undefined;
            }
        }
    } else if (node.enum.includes(data)) {
        return undefined;
    }
    return node.createError("enum-error", {
        pointer,
        schema: node.schema,
        value: data,
        values: node.enum
    });
}
