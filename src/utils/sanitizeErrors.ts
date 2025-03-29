import { isJsonError, JsonError } from "../types";

export default function sanitizeErrors<T extends JsonError = JsonError>(
    list: (JsonError | unknown)[],
    result: T[] = []
): T[] {
    for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (Array.isArray(item)) {
            sanitizeErrors(item, result);
        } else if (isJsonError(item)) {
            result.push(item as T);
        }
    }
    return result;
}
