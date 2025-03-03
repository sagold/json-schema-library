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
import { parseAnyOf } from "../features/anyOf";
import { parseDefs } from "../features/defs";

export const PARSER: ((node: SchemaNode) => void)[] = [
    parseRef, // @attention has to come before compiling any other node
    parseDefs,
    parseAllOf,
    parseAnyOf,
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
