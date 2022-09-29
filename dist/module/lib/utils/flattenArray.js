export default function flattenArray(list, result = []) {
    for (let i = 0; i < list.length; i += 1) {
        const item = list[i];
        if (Array.isArray(item)) {
            flattenArray(item, result);
        }
        else {
            result.push(item);
        }
    }
    return result;
}
