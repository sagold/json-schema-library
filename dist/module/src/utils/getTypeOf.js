const toString = Object.prototype.toString;
export function getTypeOf(value) {
    const type = toString.call(value).slice(8, -1).toLowerCase();
    if (type === "file") {
        return "object";
    }
    return type;
}
