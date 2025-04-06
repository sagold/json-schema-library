import { ValidationResult, JsonSchemaValidator } from "../Keyword";
type MaybeNestedErrors = ReturnType<JsonSchemaValidator>;
export default function sanitizeErrors(list: MaybeNestedErrors | MaybeNestedErrors[], result?: ValidationResult[]): ValidationResult[];
export {};
