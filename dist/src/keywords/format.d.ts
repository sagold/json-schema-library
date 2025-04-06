import { Keyword, JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { JsonError } from "../types";
export declare const formatKeyword: Keyword;
export declare const formatValidators: Record<string, (options: JsonSchemaValidatorParams) => undefined | JsonError | ValidationResult[]>;
