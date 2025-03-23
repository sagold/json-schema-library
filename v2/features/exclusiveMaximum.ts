import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const exclusiveMaximumFeature: Feature = {
    id: "exclusiveMaximum",
    keyword: "exclusiveMaximum",
    addValidate: ({ schema }) => schema.exclusiveMaximum != null && !isNaN(parseInt(schema.exclusiveMaximum)),
    validate: validateExclusiveMaximum
};

export function exclusiveMaximumValidator(node: SchemaNode): void {
    if (exclusiveMaximumFeature.addValidate(node)) {
        node.validators.push(exclusiveMaximumFeature.validate);
    }
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
