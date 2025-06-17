import { Keyword, JsonSchemaValidatorParams, ValidationResult } from "../Keyword.js";
import { SchemaNode } from "../types.js";
export declare const dependentRequiredKeyword: Keyword;
export declare function parseDependentRequired(node: SchemaNode): void;
export declare function validateDependentRequired({ node, data, pointer }: JsonSchemaValidatorParams): ValidationResult[];
