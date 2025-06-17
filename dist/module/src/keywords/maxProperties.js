import { isObject } from "../utils/isObject.js";
export const maxPropertiesKeyword = {
    id: "maxProperties",
    keyword: "maxProperties",
    addValidate: ({ schema }) => !isNaN(schema.maxProperties),
    validate: validateMaxProperties
};
function validateMaxProperties({ node, data, pointer = "#" }) {
    if (!isObject(data)) {
        return;
    }
    const { schema } = node;
    const propertyCount = Object.keys(data).length;
    if (isNaN(schema.maxProperties) === false && schema.maxProperties < propertyCount) {
        return node.createError("max-properties-error", {
            maxProperties: schema.maxProperties,
            length: propertyCount,
            pointer,
            schema,
            value: data
        });
    }
}
