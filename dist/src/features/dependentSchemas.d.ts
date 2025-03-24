import { Feature, JsonSchemaReducerParams, JsonSchemaValidatorParams, SchemaNode, JsonError } from "../types";
export declare const dependentSchemasFeature: Feature;
export declare function parseDependentSchemas(node: SchemaNode): void;
export declare function reduceDependentSchemas({ node, data }: JsonSchemaReducerParams): SchemaNode;
export declare function validateDependentSchemas({ node, data, pointer }: JsonSchemaValidatorParams): JsonError[];
