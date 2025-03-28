import { JsonError } from "../types";
import { Feature, JsonSchemaReducerParams, SchemaNode } from "../types";
export declare const oneOfFeature: Feature;
export declare const oneOfFuzzyFeature: Feature;
export declare function parseOneOf(node: SchemaNode): void;
export declare function reduceOneOfDeclarator({ node, data, pointer, path }: JsonSchemaReducerParams): SchemaNode | JsonError<import("../types").ErrorData<{
    [p: string]: unknown;
}>>;
/**
 * Selects and returns a oneOf schema for the given data
 *
 * @param draft
 * @param data
 * @param [schema] - current json schema containing property oneOf
 * @param [pointer] - json pointer to data
 * @return oneOf schema or an error
 */
export declare function reduceOneOfFuzzy({ node, data, pointer, path }: JsonSchemaReducerParams): SchemaNode | JsonError<import("../types").ErrorData<{
    [p: string]: unknown;
}>>;
