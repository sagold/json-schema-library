import { Keyword, JsonSchemaValidatorParams } from "../Keyword";
import { JsonError } from "../types";
export declare const dependentRequiredKeyword: Keyword;
export declare function validateDependentRequired({ node, data, pointer }: JsonSchemaValidatorParams): JsonError[];
