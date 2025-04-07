import { Keyword, JsonSchemaValidatorParams } from "../../Keyword";

export const exclusiveMaximumKeyword: Keyword = {
    id: "exclusiveMaximum",
    keyword: "exclusiveMaximum",
    addValidate: ({ schema }) => schema.exclusiveMaximum === true || !isNaN(schema.maximum),
    validate: validateExclusiveMaximum
};

function validateExclusiveMaximum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMaximum && node.schema.maximum === data) {
        return node.createError("MaximumError", {
            maximum: node.schema.exclusiveMaximum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
