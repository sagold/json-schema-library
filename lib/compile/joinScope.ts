/* eslint max-statements-per-line: ["error", { "max": 2 }] */
const suffixes = /(#)+$/;
const trailingHash = /#$/;
const startingHashAndSlash = /^[#/]+/;
const isDomain = /^[^:]+:\/\/[^/]+\//;
const trailingFragments = /\/[^/]*$/;
const idAndPointer = /#.*$/;
// @todo add missing test for urn ids
const isURN = /^urn:uuid:[0-9A-Fa-f]/;

export default function joinScope(previous?: string, id?: string) {
    if (previous == null && id == null) { return "#"; }
    if (id == null) { return previous.replace(trailingHash, ""); }
    if (isURN.test(id)) { return id; }
    if (previous == null || previous === "" || previous === "#") { return id.replace(trailingHash, ""); }
    if (id[0] === "#") { return `${previous.replace(idAndPointer, "")}${id.replace(suffixes, "")}`; }
    if (isDomain.test(id)) { return id.replace(trailingHash, ""); }

    if (isDomain.test(previous) && id.startsWith("/")) {
        // we have a domain that should be joined with an absolute path
        // thus we have to remove all paths from domain before joining
        return `${previous.replace(/(^[^:]+:\/\/[^/]+)(.*)/, "$1")}/${id.replace(startingHashAndSlash, "")}`;
    }

    return `${previous.replace(trailingFragments, "")}/${id.replace(startingHashAndSlash, "")}`;
}
