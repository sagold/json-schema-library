import { isObject } from "../utils/isObject";
export const minPropertiesKeyword = {
    id: "minProperties",
    keyword: "minProperties",
    addValidate: ({ schema }) => !isNaN(schema.minProperties),
    validate: validateMinProperties
};
function validateMinProperties({ node, data, pointer = "#" }) {
    if (!isObject(data)) {
        return;
    }
    const propertyCount = Object.keys(data).length;
    if (node.schema.minProperties > propertyCount) {
        return node.createError("MinPropertiesError", {
            minProperties: node.schema.minProperties,
            length: propertyCount,
            pointer,
            schema: node.schema,
            value: data
        });
    }
}
