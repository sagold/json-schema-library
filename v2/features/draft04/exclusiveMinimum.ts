import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../../types";

export const exclusiveMinimumFeature: Feature = {
    id: "exclusiveMinimum",
    keyword: "exclusiveMinimum",
    addValidate: ({ schema }) => schema.exclusiveMinimum === true || !isNaN(schema.minimum),
    validate: validateExclusiveMinimum
};

export function exclusiveMinimumValidator({ schema, validators }: SchemaNode): void {
    if (schema.exclusiveMinimum !== true || isNaN(schema.minimum)) {
        return undefined;
    }
    validators.push();
}

function validateExclusiveMinimum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMinimum && node.schema.minimum === data) {
        return node.errors.minimumError({
            minimum: node.schema.exclusiveMinimum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
