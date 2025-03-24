import { isJsonError } from "../types";
export default function sanitizeErrors(list, result = []) {
    for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (Array.isArray(item)) {
            sanitizeErrors(item, result);
        }
        else if (isJsonError(item)) {
            result.push(item);
        }
    }
    return result;
}
