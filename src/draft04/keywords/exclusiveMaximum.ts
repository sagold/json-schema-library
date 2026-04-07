import { Keyword, JsonSchemaValidatorParams } from "../../Keyword";
import { SchemaNode } from "../../SchemaNode";

export const exclusiveMaximumKeyword: Keyword = {
    id: "exclusiveMaximum",
    keyword: "exclusiveMaximum",
    parse,
    addValidate: ({ schema }) => schema.exclusiveMaximum === true || !isNaN(schema.maximum),
    validate: validateExclusiveMaximum
};

function parse(node: SchemaNode) {
    const { exclusiveMaximum } = node.schema;
    if (exclusiveMaximum != null && !(typeof exclusiveMaximum === "number" || typeof exclusiveMaximum === "boolean")) {
        return node.createError("schema-error", {
            pointer: node.evaluationPath,
            schema: node.schema,
            value: undefined,
            message: `Keyword 'exclusiveMaximum' must be a number - received '${typeof exclusiveMaximum}'`
        });
    }
}

function validateExclusiveMaximum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMaximum && node.schema.maximum === data) {
        return node.createError("maximum-error", {
            maximum: node.schema.exclusiveMaximum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
