import { JsonSchemaValidatorParams, SchemaNode } from "../types";

export function exclusiveMinimumValidator(node: SchemaNode): void {
    if (node.schema.exclusiveMinimum == null || isNaN(parseInt(node.schema.exclusiveMinimum))) {
        return undefined;
    }
    node.validators.push(validateExclusiveMinimum);
}

validateExclusiveMinimum.toJSON = () => "exclusiveMinimum";
function validateExclusiveMinimum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMinimum >= data) {
        return node.errors.exclusiveMinimumError({
            minimum: node.schema.exclusiveMinimum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
