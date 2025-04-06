import { SchemaNode } from "../types";
import { Keyword, JsonSchemaReducerParams, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
export declare const dependentSchemasKeyword: Keyword;
export declare function parseDependentSchemas(node: SchemaNode): void;
export declare function reduceDependentSchemas({ node, data }: JsonSchemaReducerParams): SchemaNode;
export declare function validateDependentSchemas({ node, data, pointer, path }: JsonSchemaValidatorParams): ValidationResult[];
