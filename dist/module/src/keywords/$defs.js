export const $defsKeyword = {
    id: "$defs",
    keyword: "$defs",
    parse: parseDefs
};
export function parseDefs(node) {
    var _a, _b;
    if (node.schema.$defs) {
        node.$defs = (_a = node.$defs) !== null && _a !== void 0 ? _a : {};
        Object.keys(node.schema.$defs).forEach((property) => {
            node.$defs[property] = node.compileSchema(node.schema.$defs[property], `${node.evaluationPath}/$defs/${urlEncodeJsonPointerProperty(property)}`, `${node.schemaLocation}/$defs/${property}`);
        });
    }
    if (node.schema.definitions) {
        node.$defs = (_b = node.$defs) !== null && _b !== void 0 ? _b : {};
        Object.keys(node.schema.definitions).forEach((property) => {
            node.$defs[property] = node.compileSchema(node.schema.definitions[property], `${node.evaluationPath}/definitions/${urlEncodeJsonPointerProperty(property)}`, `${node.schemaLocation}/definitions/${urlEncodeJsonPointerProperty(property)}`);
        });
    }
}
function urlEncodeJsonPointerProperty(property) {
    property = property.replace(/~/g, "~0");
    property = property.replace(/\//g, "~1");
    return encodeURIComponent(property);
}
