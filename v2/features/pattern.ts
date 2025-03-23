import { Feature, JsonSchemaValidatorParams, SchemaNode } from "../types";

export const patternFeature: Feature = {
    id: "pattern",
    keyword: "pattern",
    addValidate: ({ schema }) => typeof schema.pattern === "string",
    validate: validatePattern
};

export function patternValidator(node: SchemaNode): void {
    if (patternFeature.addValidate(node)) {
        node.validators.push(patternFeature.validate);
    }
}

function validatePattern({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (typeof data !== "string") {
        return;
    }
    const pattern = new RegExp(schema.pattern, "u");
    if (pattern.test(data) === false) {
        return node.errors.patternError({
            pattern: schema.pattern,
            description: schema.patternExample || schema.pattern,
            received: data,
            schema,
            value: data,
            pointer
        });
    }
    return undefined;
}
