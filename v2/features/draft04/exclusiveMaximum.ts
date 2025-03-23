import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../../types";

export const exclusiveMaximumFeature: Feature = {
    id: "exclusiveMaximum",
    keyword: "exclusiveMaximum",
    addValidate: ({ schema }) => schema.exclusiveMaximum === true || !isNaN(schema.maximum),
    validate: validateExclusiveMaximum
};

export function exclusiveMaximumValidator({ schema, validators }: SchemaNode): void {
    if (schema.exclusiveMaximum !== true || isNaN(schema.maximum)) {
        return undefined;
    }
    validators.push(validateExclusiveMaximum);
}

function validateExclusiveMaximum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMaximum && node.schema.maximum === data) {
        return node.errors.maximumError({
            maximum: node.schema.exclusiveMaximum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
