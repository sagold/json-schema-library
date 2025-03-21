import { JsonSchemaValidatorParams, SchemaNode } from "../types";

export function exclusiveMaximumValidator({ schema, validators }: SchemaNode): void {
    if (schema.exclusiveMaximum == null || isNaN(parseInt(schema.exclusiveMaximum))) {
        return undefined;
    }
    validators.push(validateExclusiveMaximum);
}

validateExclusiveMaximum.toJSON = () => "exclusiveMaximum";
function validateExclusiveMaximum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMaximum <= data) {
        return node.errors.exclusiveMaximumError({
            maximum: node.schema.exclusiveMaximum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
