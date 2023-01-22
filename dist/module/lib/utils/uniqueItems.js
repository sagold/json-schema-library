/**
 * @returns list with unique values only
 */
export function uniqueItems(list) {
    return list.filter((item, index) => list.indexOf(item) === index);
}
