import { isObject } from "../utils/isObject";
import { hasProperty } from "../utils/hasProperty";
export const requiredFeature = {
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
