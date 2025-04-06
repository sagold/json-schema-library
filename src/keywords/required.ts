import { isObject } from "../utils/isObject";
import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { hasProperty } from "../utils/hasProperty";

export const requiredKeyword: Keyword = {
    id: "required",
    keyword: "required",
    addValidate: ({ schema }) => Array.isArray(schema.required),
    validate: validateRequired
};

function validateRequired({ node, data, pointer = "#" }: JsonSchemaValidatorParams) {
    const { schema } = node;
    if (!isObject(data)) {
        return undefined;
    }
    return schema.required.map((property: string) => {
        if (!hasProperty(data, property)) {
            return node.errors.requiredPropertyError({
                key: property,
                pointer,
                schema,
                value: data
            });
        }
        return undefined;
    });
}
