import { Keyword, JsonSchemaValidatorParams } from "../Keyword";

export const deprecatedKeyword: Keyword = {
    id: "deprecated",
    keyword: "deprecated",
    addValidate: ({ schema }) => schema.deprecated === true,
    validate: validateDeprecated
};

function validateDeprecated({ node, data, pointer }: JsonSchemaValidatorParams) {
    return [
        node.createAnnotation("deprecated-warning", {
            pointer,
            schema: node.schema,
            value: data
        })
    ];
}
