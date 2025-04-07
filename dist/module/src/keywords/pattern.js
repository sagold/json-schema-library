export const patternKeyword = {
    id: "pattern",
    keyword: "pattern",
    addValidate: ({ schema }) => typeof schema.pattern === "string",
    validate: validatePattern
};
function validatePattern({ node, data, pointer = "#" }) {
    const { schema } = node;
    if (typeof data !== "string") {
        return;
    }
    const pattern = new RegExp(schema.pattern, "u");
    if (pattern.test(data) === false) {
        return node.createError("PatternError", {
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
