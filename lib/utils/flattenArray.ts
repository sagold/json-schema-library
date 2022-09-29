export default function flattenArray<T = unknown>(list: unknown[], result: T[] = []): T[] {
    for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (Array.isArray(item)) {
            flattenArray(item, result);
        } else {
            result.push(item as T);
        }
    }
    return result;
}
