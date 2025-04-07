import { JsonSchemaValidatorParams, ValidationResult } from "../Keyword";
import { JsonError } from "../types";
export declare const formats: Record<string, (options: JsonSchemaValidatorParams) => undefined | JsonError | ValidationResult[]>;
