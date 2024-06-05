import { SchemaNode } from "../schemaNode";
import { JsonError } from "../types";

export interface JsonTypeValidator {
    (
        node: SchemaNode,
        value: unknown
    ): Array<void | undefined | JsonError | JsonError[] | JsonError[][]>;
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
const typeValidators: Record<string, JsonTypeValidator> = {
    array: (node, value) =>
        node.draft.typeKeywords.array
            .filter((key) => node.schema && node.schema[key] != null)
            .map((key) => node.draft.validateKeyword[key](node, value)),

    object: (node, value) =>
        node.draft.typeKeywords.object
            .filter((key) => node.schema && node.schema[key] != null)
            .map((key) => node.draft.validateKeyword[key](node, value)),

    string: (node, value) =>
        node.draft.typeKeywords.string
            .filter((key) => node.schema && node.schema[key] != null)
            .map((key) => node.draft.validateKeyword[key](node, value)),

    integer: (node, value) =>
        node.draft.typeKeywords.number
            .filter((key) => node.schema && node.schema[key] != null)
            .map((key) => node.draft.validateKeyword[key](node, value)),

    number: (node, value) =>
        node.draft.typeKeywords.number
            .filter((key) => node.schema && node.schema[key] != null)
            .map((key) => node.draft.validateKeyword[key](node, value)),

    boolean: (node, value) =>
        node.draft.typeKeywords.boolean
            .filter((key) => node.schema && node.schema[key] != null)
            .map((key) => node.draft.validateKeyword[key](node, value)),

    null: (node, value) =>
        node.draft.typeKeywords.null
            .filter((key) => node.schema && node.schema[key] != null)
            .map((key) => node.draft.validateKeyword[key](node, value))
};

export default typeValidators;
