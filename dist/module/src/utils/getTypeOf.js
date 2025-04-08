const toString = Object.prototype.toString;
export function getTypeOf(value) {
    const type = toString
        .call(value)
        .match(/\s([^\]]+)\]/)
        .pop()
        .toLowerCase();
    if (type === "file") {
        return "object";
    }
    return type;
}
