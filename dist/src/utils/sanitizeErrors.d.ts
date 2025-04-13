import { JsonError } from "../types";
import { ValidationResult, JsonSchemaValidator } from "../Keyword";
type MaybeNestedErrors = ReturnType<JsonSchemaValidator>;
export default function sanitizeErrors(list: MaybeNestedErrors | MaybeNestedErrors[], result?: (undefined | JsonError | Promise<JsonError> | ValidationResult)[]): ValidationResult[];
export {};
