import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { equalJson } from "../utils/equalJson";

export const constKeyword: Keyword = {
    id: "const",
    keyword: "const",
    addValidate: ({ schema }) => schema.const !== undefined,
    validate: validateConst
};

function validateConst({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (!equalJson(data, node.schema.const)) {
        return [
            node.createError("const-error", { pointer, schema: node.schema, value: data, expected: node.schema.const })
        ];
    }
}
