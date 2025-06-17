import { isObject } from "../utils/isObject.js";
import { hasProperty } from "../utils/hasProperty.js";
export const requiredKeyword = {
    id: "required",
    keyword: "required",
    addValidate: ({ schema }) => Array.isArray(schema.required),
    validate: validateRequired
};
function validateRequired({ node, data, pointer = "#" }) {
    const { schema } = node;
    if (!isObject(data)) {
        return undefined;
    }
    return schema.required.map((property) => {
        if (!hasProperty(data, property)) {
            return node.createError("required-property-error", {
                key: property,
                pointer,
                schema,
                value: data
            });
        }
        return undefined;
    });
}
