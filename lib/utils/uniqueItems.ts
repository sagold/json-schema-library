/**
 * @returns list with unique values only
 */
export function uniqueItems(list: (number | string | boolean | null | undefined)[]) {
    return list.filter((item, index) => list.indexOf(item) === index);
}
