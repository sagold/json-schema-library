import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const minimumFeature: Feature = {
    id: "minimum",
    keyword: "minimum",
    addValidate: ({ schema }) => !isNaN(schema.minimum),
    validate: validateMinimum
};

export function minimumValidator(node: SchemaNode): void {
    if (minimumFeature.addValidate(node)) {
        node.validators.push(minimumFeature.validate);
    }
}

validateMinimum.toJSON = () => "minimum";
function validateMinimum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (isNaN(data as number)) {
        return undefined;
    }
    const { schema } = node;
    if (schema.minimum > data) {
        return node.errors.minimumError({
            minimum: schema.minimum,
            length: data,
            pointer,
            schema,
            value: data
        });
    }
    if (schema.exclusiveMinimum === true && schema.minimum === data) {
        return node.errors.minimumError({
            minimum: schema.minimum,
            length: data,
            pointer,
            schema,
            value: data
        });
    }
    return undefined;
}
