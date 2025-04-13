import { Keyword, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { SchemaNode } from "../types";
export declare const dependentRequiredKeyword: Keyword;
export declare function parseDependentRequired(node: SchemaNode): void;
export declare function validateDependentRequired({ node, data, pointer }: JsonSchemaValidatorParams): ValidationResult[];
