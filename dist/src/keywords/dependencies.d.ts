import { SchemaNode } from "../types.js";
import { Keyword, JsonSchemaReducerParams } from "../Keyword.js";
export declare const dependenciesKeyword: Keyword;
export declare function parseDependencies(node: SchemaNode): void;
export declare function reduceDependencies({ node, data, key, pointer, path }: JsonSchemaReducerParams): SchemaNode;
