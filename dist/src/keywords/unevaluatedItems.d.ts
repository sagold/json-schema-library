import { SchemaNode } from "../types.js";
import { Keyword } from "../Keyword.js";
/**
 * @draft >= 2019-09
 * Similar to additionalItems, but can "see" into subschemas and across references
 * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.1.3
 */
export declare const unevaluatedItemsKeyword: Keyword;
export declare function parseUnevaluatedItems(node: SchemaNode): void;
