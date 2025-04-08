// @todo this should be done with every added property in spointer
// @todo this creates a mixed schema, where $defs, etc are not uri-encoded (would be %24defs)
function urlEncodeJsonPointerProperty(property) {
    property = property.replace(/~/g, "~0");
    property = property.replace(/\//g, "~1");
    return encodeURIComponent(property);
}
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
            node.$defs[property] = node.compileSchema(node.schema.$defs[property], `${node.spointer}/$defs/${urlEncodeJsonPointerProperty(property)}`, `${node.schemaId}/$defs/${property}`);
        });
    }
    if (node.schema.definitions) {
        node.$defs = (_b = node.$defs) !== null && _b !== void 0 ? _b : {};
        Object.keys(node.schema.definitions).forEach((property) => {
            node.$defs[property] = node.compileSchema(node.schema.definitions[property], `${node.spointer}/definitions/${urlEncodeJsonPointerProperty(property)}`, `${node.schemaId}/definitions/${urlEncodeJsonPointerProperty(property)}`);
        });
    }
}
