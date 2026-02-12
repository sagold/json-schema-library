import { isAnnotation } from "../types";
import { ValidationAnnotation, ValidationReturnType } from "../Keyword";

export default function sanitizeErrors(
    list: ValidationReturnType | ValidationAnnotation[],
    result: ValidationAnnotation[] = []
) {
    if (!Array.isArray(list)) {
        if (list !== undefined) {
            return [list];
        }
        return [];
    }
    for (const item of list) {
        if (Array.isArray(item)) {
            sanitizeErrors(item, result);
        } else if (isAnnotation(item) || item instanceof Promise) {
            result.push(item);
        }
    }
    return result;
}
