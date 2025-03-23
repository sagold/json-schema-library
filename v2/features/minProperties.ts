import { isObject } from "../../lib/utils/isObject";
import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const minPropertiesFeature: Feature = {
    id: "minProperties",
    keyword: "minProperties",
    addValidate: ({ schema }) => !isNaN(schema.minProperties),
    validate: validateMinProperties
};

export function minPropertiesValidator(node: SchemaNode): void {
    if (minPropertiesFeature.addValidate(node)) {
        node.validators.push(minPropertiesFeature.validate);
    }
}

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
