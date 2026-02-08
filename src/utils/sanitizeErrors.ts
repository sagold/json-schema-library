import { isJsonError, JsonError } from "../types";
import { ValidationResult, JsonSchemaValidator } from "../Keyword";

type MaybeNestedErrors = ReturnType<JsonSchemaValidator>;

export default function sanitizeErrors(
    list: MaybeNestedErrors | MaybeNestedErrors[],
    result: (JsonError | Promise<JsonError | undefined> | ValidationResult)[] = []
): ValidationResult[] {
    if (!Array.isArray(list)) {
        if (list !== undefined) {
            return [list];
        }
        return [];
    }
    for (const item of list) {
        if (Array.isArray(item)) {
            sanitizeErrors(item, result);
        } else if (isJsonError(item) || item instanceof Promise) {
            result.push(item);
        }
    }
    return result;
}
