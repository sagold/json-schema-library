import { Feature, SchemaNode } from "../types";

// @todo this should be done with every added property in spointer
// @todo this creates a mixed schema, where $defs, etc are not uri-encoded (would be %24defs)
function urlEncodeJsonPointerProperty(property: string) {
    property = property.replace(/~/g, "~0");
    property = property.replace(/\//g, "~1");
    return encodeURIComponent(property);
}

export const defsFeature: Feature = {
    id: "$defs",
    keyword: "$defs",
    parse: parseDefs
};

export function parseDefs(node: SchemaNode) {
    if (node.schema.$defs) {
        node.$defs = node.$defs ?? {};
        Object.keys(node.schema.$defs).forEach((property) => {
            node.$defs[property] = node.compileSchema(
                node.schema.$defs[property],
                `${node.spointer}/$defs/${urlEncodeJsonPointerProperty(property)}`,
                `${node.schemaId}/$defs/${property}`
            );
        });
    }
    if (node.schema.definitions) {
        node.$defs = node.$defs ?? {};
        Object.keys(node.schema.definitions).forEach((property) => {
            node.$defs[property] = node.compileSchema(
                node.schema.definitions[property],
                `${node.spointer}/definitions/${urlEncodeJsonPointerProperty(property)}`,
                `${node.schemaId}/definitions/${urlEncodeJsonPointerProperty(property)}`
            );
        });
    }
}
