import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { SchemaNode } from "../SchemaNode";
import settings from "../settings";

const KEYWORD = "pattern";
const { REGEX_FLAGS } = settings;

export const patternKeyword: Keyword<"pattern"> = {
    id: KEYWORD,
    keyword: KEYWORD,
    parse: parsePattern,
    addValidate: (node) => node[KEYWORD] != null,
    validate: validatePattern
};

function parsePattern(node: SchemaNode) {
    const pattern = node.schema[KEYWORD];
    if (pattern == null) {
        return;
    }
    if (typeof pattern !== "string") {
        return node.createError("schema-error", {
            pointer: node.schemaLocation,
            schema: node.schema,
            value: pattern,
            message: `Keyword 'pattern' must be a string - received '${typeof pattern}'`
        });
    }
    try {
        node[KEYWORD] = new RegExp(pattern, node.schema.regexFlags ?? REGEX_FLAGS);
    } catch (e) {
        return node.createError("schema-error", {
            pointer: node.schemaLocation,
            schema: node.schema,
            value: pattern,
            message: (e as Error).message
        });
    }
}

function validatePattern({ node, data, pointer = "#" }: JsonSchemaValidatorParams<"pattern">) {
    if (typeof data !== "string") {
        return;
    }
    if (node.pattern.test(data) === false) {
        const { schema } = node;
        return node.createError("pattern-error", {
            pattern: schema.pattern,
            description: schema.patternExample || schema.pattern,
            received: data,
            schema,
            value: data,
            pointer
        });
    }
}
