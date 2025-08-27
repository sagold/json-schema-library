import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import settings from "../settings";

const { REGEX_FLAGS } = settings;

export const patternKeyword: Keyword = {
    id: "pattern",
    keyword: "pattern",
    addValidate: ({ schema }) => typeof schema.pattern === "string",
    validate: validatePattern
};

function validatePattern({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (typeof data !== "string") {
        return;
    }
    const pattern = new RegExp(schema.pattern, schema.regexFlags ?? REGEX_FLAGS);
    if (pattern.test(data) === false) {
        return node.createError("pattern-error", {
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
