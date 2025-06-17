import { JsonError } from "../types.js";
import { ValidationResult, JsonSchemaValidator } from "../Keyword.js";
type MaybeNestedErrors = ReturnType<JsonSchemaValidator>;
export default function sanitizeErrors(list: MaybeNestedErrors | MaybeNestedErrors[], result?: (undefined | JsonError | Promise<JsonError> | ValidationResult)[]): ValidationResult[];
export {};
