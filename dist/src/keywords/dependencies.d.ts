import { SchemaNode } from "../types";
import { Keyword, JsonSchemaReducerParams } from "../Keyword";
export declare const dependenciesKeyword: Keyword;
export declare function parseDependencies(node: SchemaNode): void;
export declare function reduceDependencies({ node, data, key, path }: JsonSchemaReducerParams): SchemaNode;
