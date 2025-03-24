import getTypeOf from "../utils/getTypeOf";
export const typeFeature = {
    id: "type",
    keyword: "type",
    addReduce: (node) => Array.isArray(node.schema.type),
    reduce: reduceType,
    addValidate: ({ schema }) => schema.type != null,
    validate: validateType
};
function reduceType({ node, pointer, data }) {
    const dataType = getJsonSchemaType(data, node.schema.type);
    if (dataType !== "undefined" && Array.isArray(node.schema.type) && node.schema.type.includes(dataType)) {
        return node.compileSchema({ ...node.schema, pointer, type: dataType }, node.spointer);
    }
    return undefined;
}
function getJsonSchemaType(value, expectedType) {
    const jsType = getTypeOf(value);
    if (jsType === "number" &&
        (expectedType === "integer" || (Array.isArray(expectedType) && expectedType.includes("integer")))) {
        return Number.isInteger(value) || isNaN(value) ? "integer" : "number";
    }
    return jsType;
}
function validateType({ node, data, pointer }) {
    const schema = node.schema;
    const dataType = getJsonSchemaType(data, schema.type);
    if (data === undefined ||
        schema.type === dataType ||
        (Array.isArray(schema.type) && schema.type.includes(dataType))) {
        return;
    }
    return node.errors.typeError({
        value: data,
        received: dataType,
        expected: schema.type,
        schema,
        pointer
    });
}
