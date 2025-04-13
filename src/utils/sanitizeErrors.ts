import { isJsonError, JsonError } from "../types";
import { ValidationResult, JsonSchemaValidator } from "../Keyword";

type MaybeNestedErrors = ReturnType<JsonSchemaValidator>;

export default function sanitizeErrors(
    list: MaybeNestedErrors | MaybeNestedErrors[],
    result: (undefined | JsonError | Promise<JsonError> | ValidationResult)[] = []
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
