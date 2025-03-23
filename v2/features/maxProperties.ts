import { isObject } from "../../lib/utils/isObject";
import { Feature, JsonSchemaValidatorParams } from "../types";

export const maxPropertiesFeature: Feature = {
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
        return node.errors.maxPropertiesError({
            maxProperties: schema.maxProperties,
            length: propertyCount,
            pointer,
            schema,
            value: data
        });
    }
}
