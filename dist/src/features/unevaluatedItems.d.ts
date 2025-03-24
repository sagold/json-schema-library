import { Feature, SchemaNode } from "../types";
/**
 * @draft >= 2019-09
 * Similar to additionalItems, but can "see" into subschemas and across references
 * https://json-schema.org/draft/2019-09/json-schema-core#rfc.section.9.3.1.3
 */
export declare const unevaluatedItemsFeature: Feature;
export declare function parseUnevaluatedItems(node: SchemaNode): void;
