import equal from "fast-deep-equal";
export const constKeyword = {
    id: "const",
    keyword: "const",
    addValidate: ({ schema }) => schema.const !== undefined,
    validate: validateConst
};
function validateConst({ node, data, pointer }) {
    if (!equal(data, node.schema.const)) {
        return [
            node.createError("ConstError", { pointer, schema: node.schema, value: data, expected: node.schema.const })
        ];
    }
}
