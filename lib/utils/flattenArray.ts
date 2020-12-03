export default function flattenArray<T = any>(list: Array<any>, result = []): Array<T> {
    for (let i = 0; i < list.length; i += 1) {
        if (Array.isArray(list[i])) {
            flattenArray(list[i], result);
        } else {
            result.push(list[i]);
        }
    }
    return result;
}
