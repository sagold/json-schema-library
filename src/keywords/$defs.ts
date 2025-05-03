import { Keyword } from "../Keyword";
import { SchemaNode } from "../types";

export const $defsKeyword: Keyword = {
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
                `${node.evaluationPath}/$defs/${urlEncodeJsonPointerProperty(property)}`,
                `${node.schemaLocation}/$defs/${property}`
            );
        });
    }
    if (node.schema.definitions) {
        node.$defs = node.$defs ?? {};
        Object.keys(node.schema.definitions).forEach((property) => {
            node.$defs[property] = node.compileSchema(
                node.schema.definitions[property],
                `${node.evaluationPath}/definitions/${urlEncodeJsonPointerProperty(property)}`,
                `${node.schemaLocation}/definitions/${urlEncodeJsonPointerProperty(property)}`
            );
        });
    }
}

function urlEncodeJsonPointerProperty(property: string) {
    property = property.replace(/~/g, "~0");
    property = property.replace(/\//g, "~1");
    return encodeURIComponent(property);
}
