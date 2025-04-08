import { Keyword, JsonSchemaValidatorParams } from "../Keyword";

export const exclusiveMinimumKeyword: Keyword = {
    id: "exclusiveMinimum",
    keyword: "exclusiveMinimum",
    addValidate: ({ schema }) => schema.exclusiveMinimum != null && !isNaN(parseInt(schema.exclusiveMinimum)),
    validate: validateExclusiveMinimum
};

function validateExclusiveMinimum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMinimum >= data) {
        return node.createError("exclusive-minimum-error", {
            minimum: node.schema.exclusiveMinimum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
