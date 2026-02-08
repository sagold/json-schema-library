import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { getTypeOf } from "../utils/getTypeOf";

export const enumKeyword: Keyword = {
    id: "enum",
    keyword: "enum",
    addValidate: ({ schema }) => Array.isArray(schema.enum),
    validate: validateEnum
};

function validateEnum({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    const { schema } = node;
    const type = getTypeOf(data);
    if (type === "object" || type === "array") {
        const valueStr = JSON.stringify(data);
        for (const e of schema.enum) {
            if (JSON.stringify(e) === valueStr) {
                return undefined;
            }
        }
    } else if (schema.enum.includes(data)) {
        return undefined;
    }
    return node.createError("enum-error", {
        pointer,
        schema,
        value: data,
        values: schema.enum
    });
}
