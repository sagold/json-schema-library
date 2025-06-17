import { JsonSchemaValidatorParams, ValidationResult } from "../Keyword.js";
import { JsonError } from "../types.js";
export declare const formats: Record<string, (options: JsonSchemaValidatorParams) => undefined | JsonError | ValidationResult[]>;
