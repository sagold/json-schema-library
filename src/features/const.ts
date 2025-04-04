import { Feature, JsonSchemaValidatorParams } from "../Feature";
import equal from "fast-deep-equal";

export const constFeature: Feature = {
    id: "const",
    keyword: "const",
    addValidate: ({ schema }) => schema.const !== undefined,
    validate: validateConst
};

function validateConst({ node, data, pointer }: JsonSchemaValidatorParams) {
    if (!equal(data, node.schema.const)) {
        return [node.errors.constError({ pointer, schema: node.schema, value: data, expected: node.schema.const })];
    }
}
