import { Feature, JsonSchemaReducerParams, JsonError, SchemaNode } from "../types";
export declare const dependenciesFeature: Feature;
export declare function parseDependencies(node: SchemaNode): void;
export declare function reduceDependencies({ node, data, path }: JsonSchemaReducerParams): SchemaNode | JsonError<import("../types").ErrorData<{
    [p: string]: unknown;
}>>;
