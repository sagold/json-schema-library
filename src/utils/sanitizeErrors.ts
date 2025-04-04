import { isJsonError } from "../types";
import { ValidationResult, JsonSchemaValidator } from "../Feature";

type MaybeNestedErrors = ReturnType<JsonSchemaValidator>;

export default function sanitizeErrors(
    list: MaybeNestedErrors | MaybeNestedErrors[],
    result: ValidationResult[] = []
): ValidationResult[] {
    if (!Array.isArray(list)) {
        return [list];
    }
    for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (Array.isArray(item)) {
            sanitizeErrors(item, result);
        } else if (isJsonError(item) || item instanceof Promise) {
            result.push(item);
        }
    }
    return result;
}
