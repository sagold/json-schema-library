import { SchemaNode } from "../schemaNode";
import { JsonError } from "../types";
export interface JsonTypeValidator {
    (node: SchemaNode, value: unknown): Array<void | undefined | JsonError | JsonError[] | JsonError[][]>;
}
export interface JsonValidator {
    (node: SchemaNode, value: unknown): void | undefined | JsonError | JsonError[] | JsonError[][];
}
/**
 * @todo: type is also a keyword, as is properties, items, etc
 *
 * An instance has one of six primitive types (http://json-schema.org/latest/json-schema-node.draft.html#rfc.section.4.2)
 * or seven in case of ajv https://github.com/epoberezkin/ajv/blob/master/KEYWORDS.md#type
 * 1 null, 2 boolean, 3 object, 4 array, 5 number, 6 string (7 integer)
 */
declare const typeValidators: Record<string, JsonTypeValidator>;
export default typeValidators;
