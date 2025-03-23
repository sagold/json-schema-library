import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const maxItemsFeature: Feature = {
    id: "maxItems",
    keyword: "maxItems",
    addValidate: ({ schema }) => !isNaN(schema.maxItems),
    validate: validateMaxItems
};

export function maxItemsValidator(node: SchemaNode): void {
    if (maxItemsFeature.addValidate(node)) {
        node.validators.push(maxItemsFeature.validate);
    }
}

function validateMaxItems({ node, data, pointer }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (Array.isArray(data) && schema.maxItems < data.length) {
        return node.errors.maxItemsError({
            maximum: schema.maxItems,
            length: data.length,
            schema,
            value: data,
            pointer
        });
    }
}
