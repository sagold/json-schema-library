import { isObject } from "../utils/isObject";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";

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
        return node.errors.minPropertiesError({
            minProperties: node.schema.minProperties,
            length: propertyCount,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
