import { SchemaNode } from "../types.js";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword.js";
export declare const dependentSchemasKeyword: Keyword;
export declare function parseDependentSchemas(node: SchemaNode): void;
export declare function reduceDependentSchemas({ node, data }: JsonSchemaReducerParams): SchemaNode;
export declare function validateDependentSchemas({ node, data, pointer, path }: JsonSchemaValidatorParams): ValidationResult[];
