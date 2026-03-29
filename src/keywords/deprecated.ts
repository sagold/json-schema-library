import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";

const KEYWORD = "deprecated";

export const deprecatedKeyword: Keyword = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parseDeprecated,
    addValidate: (node) => node[KEYWORD] === true,
    validate: validateDeprecated
};

function parseDeprecated(node: SchemaNode) {
    const deprecated = node.schema[KEYWORD];
    if (deprecated == null) {
        return;
    }
    if (typeof deprecated !== "boolean") {
        return node.createError("schema-error", {
            pointer: `${node.schemaLocation}/${KEYWORD}`,
            schema: node.schema,
            value: deprecated,
            message: `Keyword '${KEYWORD}' must be a boolean - received '${typeof deprecated}'`
        });
    }
    node[KEYWORD] = deprecated;
}

function validateDeprecated({ node, data, pointer }: JsonSchemaValidatorParams) {
    return [
        node.createAnnotation(
            "deprecated-warning",
            {
                pointer,
                schema: node.schema,
                value: data
            },
            node.schema.deprecatedMessage
        )
    ];
}
