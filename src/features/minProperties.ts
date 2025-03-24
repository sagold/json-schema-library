import { isObject } from "../utils/isObject";
import { Feature, JsonSchemaValidatorParams } from "../types";

export const minPropertiesFeature: Feature = {
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
