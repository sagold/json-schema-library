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

export const PARSER: ((node: SchemaNode) => void)[] = [
    parseAllOf,
    parseContains,
    parseIfThenElse,
    parseProperties,
    parsePatternProperties,
    parseOneOf,
    parseItems,
    parseAdditionalProperties, // @attention has to come after other object-property parser
    parseAdditionalItems // @attention has to come after other object-property parser
].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
