import { Feature, JsonSchemaValidatorParams } from "../Feature";

export const exclusiveMinimumFeature: Feature = {
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
        return node.errors.exclusiveMinimumError({
            minimum: node.schema.exclusiveMinimum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
