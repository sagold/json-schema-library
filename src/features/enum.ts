import { Feature, JsonSchemaValidatorParams } from "../Feature";
import getTypeOf from "../utils/getTypeOf";

export const enumFeature: Feature = {
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
        for (let i = 0; i < schema.enum.length; i += 1) {
            if (JSON.stringify(schema.enum[i]) === valueStr) {
                return undefined;
            }
        }
    } else if (schema.enum.includes(data)) {
        return undefined;
    }
    return node.errors.enumError({
        pointer,
        schema,
        value: data
    });
}
