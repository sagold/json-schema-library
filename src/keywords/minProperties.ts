import { isObject } from "../utils/isObject.js";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword.js";

export const minPropertiesKeyword: Keyword = {
    id: "minProperties",
    keyword: "minProperties",
    addValidate: ({ schema }) => !isNaN(schema.minProperties),
    validate: validateMinProperties
};

function validateMinProperties({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return;
    }
    const propertyCount = Object.keys(data).length;
    if (node.schema.minProperties > propertyCount) {
        return node.createError("min-properties-error", {
            minProperties: node.schema.minProperties,
            length: propertyCount,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
