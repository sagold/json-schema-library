import { Keyword, JsonSchemaReducerParams } from "../Keyword.js";
import { SchemaNode } from "../types.js";
export declare const oneOfKeyword: Keyword;
export declare const oneOfFuzzyKeyword: Keyword;
export declare function parseOneOf(node: SchemaNode): void;
export declare function reduceOneOfDeclarator({ node, data, pointer, path }: JsonSchemaReducerParams): SchemaNode | import("../types.js").JsonError;
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft
 * @param data
 * @param [schema] - current json schema containing property oneOf
 * @param [pointer] - json pointer to data
 * @return oneOf schema or an error
 */
export declare function reduceOneOfFuzzy({ node, data, pointer, path }: JsonSchemaReducerParams): SchemaNode | import("../types.js").JsonError;
