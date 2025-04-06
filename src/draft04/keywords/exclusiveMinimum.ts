import { Keyword, JsonSchemaValidatorParams } from "../../Keyword";

export const exclusiveMinimumKeyword: Keyword = {
    id: "exclusiveMinimum",
    keyword: "exclusiveMinimum",
    addValidate: ({ schema }) => schema.exclusiveMinimum === true || !isNaN(schema.minimum),
    validate: validateExclusiveMinimum
};

function validateExclusiveMinimum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMinimum && node.schema.minimum === data) {
        return node.errors.minimumError({
            minimum: node.schema.exclusiveMinimum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
