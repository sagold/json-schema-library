import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const maximumFeature: Feature = {
    id: "maximum",
    keyword: "maximum",
    addValidate: ({ schema }) => !isNaN(schema.maximum),
    validate: validateMaximum
};

export function maximumValidator(node: SchemaNode): void {
    if (maximumFeature.addValidate(node)) {
        node.validators.push(maximumFeature.validate);
    }
}

function validateMaximum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (isNaN(data as number)) {
        return undefined;
    }
    const { schema } = node;
    if (schema.maximum && schema.maximum < data) {
        return node.errors.maximumError({
            maximum: schema.maximum,
            length: data,
            value: data,
            pointer,
            schema
        });
    }
    if (schema.maximum && schema.exclusiveMaximum === true && schema.maximum === data) {
        return node.errors.maximumError({
            maximum: schema.maximum,
            length: data,
            pointer,
            schema,
            value: data
        });
    }
    return undefined;
}
