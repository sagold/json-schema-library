import { Keyword, JsonSchemaValidatorParams } from "../../Keyword";
import { SchemaNode } from "../../SchemaNode";

export const exclusiveMinimumKeyword: Keyword = {
    id: "exclusiveMinimum",
    keyword: "exclusiveMinimum",
    parse,
    addValidate: ({ schema }) => schema.exclusiveMinimum === true || !isNaN(schema.minimum),
    validate: validateExclusiveMinimum
};

function parse(node: SchemaNode) {
    const { exclusiveMinimum } = node.schema;
    if (exclusiveMinimum != null && !(typeof exclusiveMinimum === "number" || typeof exclusiveMinimum === "boolean")) {
        return node.createError("schema-error", {
            pointer: node.evaluationPath,
            schema: node.schema,
            value: undefined,
            message: `Keyword 'exclusiveMinimum' must be a number - received '${typeof exclusiveMinimum}'`
        });
    }
}

function validateExclusiveMinimum({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (typeof data !== "number") {
        return undefined;
    }
    if (node.schema.exclusiveMinimum && node.schema.minimum === data) {
        return node.createError("minimum-error", {
            minimum: node.schema.exclusiveMinimum,
            length: data,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
