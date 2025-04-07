import { isObject } from "../utils/isObject";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";

export const maxPropertiesKeyword: Keyword = {
    id: "maxProperties",
    keyword: "maxProperties",
    addValidate: ({ schema }) => !isNaN(schema.maxProperties),
    validate: validateMaxProperties
};

function validateMaxProperties({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    if (!isObject(data)) {
        return;
    }
    const { schema } = node;
    const propertyCount = Object.keys(data).length;
    if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
        return node.createError("MaxPropertiesError", {
            maxProperties: schema.maxProperties,
            length: propertyCount,
            pointer,
            schema,
            value: data
        });
    }
}
