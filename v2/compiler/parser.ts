import { SchemaNode } from "./types";
import { parseAdditionalProperties } from "../features/additionalProperties";
import { parseProperties } from "../features/properties";
import { parseAllOf } from "../features/allOf";
import { parseIfThenElse } from "../features/ifthenelse";
import { parsePatternProperties } from "../features/patternProperties";
import { parseItems } from "../features/items";
import { parseAdditionalItems } from "../features/additionalItems";
import { parseContains } from "../features/contains";
import { parseOneOf } from "../features/oneOf";
import { parseRef } from "../features/ref";
import { parseNot } from "../features/not";

// @todo this should be done with every added property in spointer
// @todo this creates a mixed schema, where $defs, etc are not uri-encoded (would be %24defs)
function urlEncodeJsonPointerProperty(property: string) {
    property = property.replace(/~/g, "~0");
    property = property.replace(/\//g, "~1");
    return encodeURIComponent(property);
}

export const PARSER: ((node: SchemaNode) => void)[] = [
    parseRef, // @attention has to come before compiling any other node
    function parseDefs(node: SchemaNode) {
        if (node.schema.$defs) {
            Object.keys(node.schema.$defs).forEach((property) => {
                node.compileSchema(
                    node.draft,
                    node.schema.$defs[property],
                    `${node.spointer}/$defs/${urlEncodeJsonPointerProperty(property)}`
                );
            });
        }
        if (node.schema.definitions) {
            Object.keys(node.schema.definitions).forEach((property) => {
                node.compileSchema(
                    node.draft,
                    node.schema.definitions[property],
                    `${node.spointer}/definitions/${urlEncodeJsonPointerProperty(property)}`
                );
            });
        }
    },
    parseAllOf,
    parseContains,
    parseIfThenElse,
    parseProperties,
    parsePatternProperties,
    parseNot,
    parseOneOf,
    parseItems,
    parseAdditionalProperties, // @attention has to come after other object-property parser
    parseAdditionalItems // @attention has to come after other object-property parser
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
