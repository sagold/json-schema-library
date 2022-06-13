/* eslint max-statements-per-line: ["error", { "max": 2 }] */
const suffixes = /(#|\/)+$/;
const trailingHash = /#$/;
const isDomain = /^[^:]+:\/\/[^/]+\//;
const trailingFragments = /\/[^/]*$/;
const idAndPointer = /#.*$/;
export default function joinScope(previous, id) {
    if (previous == null && id == null) {
        return "#";
    }
    if (id == null) {
        return previous.replace(trailingHash, "");
    }
    if (previous == null) {
        return id.replace(trailingHash, "");
    }
    if (id[0] === "#") {
        return `${previous.replace(idAndPointer, "")}${id.replace(suffixes, "")}`;
    }
    if (isDomain.test(id)) {
        return id.replace(trailingHash, "");
    }
    return `${previous.replace(trailingFragments, "")}/${id.replace(trailingHash, "")}`;
}
