import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { isNumber } from "../types";

export const minimumKeyword: Keyword = {
    id: "minimum",
    keyword: "minimum",
    addValidate: ({ schema }) => !isNaN(schema.minimum),
    validate: validateMinimum
};

function validateMinimum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (!isNumber(data)) {
        return undefined;
    }
    const { schema } = node;
    if (schema.minimum > data) {
        return node.createError("minimum-error", {
            minimum: schema.minimum,
            length: data,
            pointer,
            schema,
            value: data
        });
    }
    if (schema.exclusiveMinimum === true && schema.minimum === data) {
        return node.createError("minimum-error", {
            minimum: schema.minimum,
            length: data,
            pointer,
            schema,
            value: data
        });
    }
    return undefined;
}
