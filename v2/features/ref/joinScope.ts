/* eslint max-statements-per-line: ["error", { "max": 2 }] */
const suffixes = /(#)+$/;
const trailingHash = /#$/;
const startingHashAndSlash = /^[#/]+/;
const isDomain = /^[^:]+:\/\/[^/]+\//;
const trailingFragments = /\/[^/]*$/;
const idAndPointer = /#.*$/;
// @todo add missing test for urn ids
const isURN = /^urn:uuid:[0-9A-Fa-f]/;

function _joinScope(previous?: string, id?: string) {
    if (previous == null && (id == null || id === "")) {
        return "#";
    }
    if (id == null || id === "") {
        return previous.replace(trailingHash, "");
    }
    if (isURN.test(id)) {
        return id;
    }
    if (previous == null || previous === "" || previous === "#") {
        return id.replace(trailingHash, "");
    }
    if (id[0] === "#") {
        return `${previous.replace(idAndPointer, "")}${id.replace(suffixes, "")}`;
    }
    if (isDomain.test(id)) {
        return id.replace(trailingHash, "");
    }

    if (isDomain.test(previous) && id.startsWith("/")) {
        // we have a domain that should be joined with an absolute path
        // thus we have to remove all paths from domain before joining
        return `${previous.replace(/(^[^:]+:\/\/[^/]+)(.*)/, "$1")}/${id.replace(startingHashAndSlash, "")}`;
    }

    return `${previous.replace(trailingFragments, "")}/${id.replace(startingHashAndSlash, "")}`;
}

// tryout generated version
export function joinScope(baseId?: string, childId?: string): string {
    try {
        // If neither baseId nor childId is provided, return an empty string
        if (!baseId && !childId) {
            return "";
        }

        // If only childId is provided, return it as an absolute URL (if valid)
        if (!baseId) {
            return childId ?? "";
        }

        // Convert baseId to a valid URL
        let baseUrl = new URL(baseId);

        // Fix baseId if it lacks a trailing slash and is not a file (heuristic)
        if (!baseUrl.pathname.endsWith("/") && !baseUrl.pathname.includes(".")) {
            baseUrl = new URL(baseUrl.href + "/");
        }

        // If childId is missing, return the baseId unchanged
        if (!childId) {
            return baseUrl.href;
        }

        // If childId is an absolute URL, return it directly
        if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(childId)) {
            return childId;
        }

        // If childId is just a fragment (e.g., "#sub"), append it to the base URL
        if (childId.startsWith("#")) {
            return baseUrl.href + childId;
        }

        // Resolve the childId as a relative URL based on baseId
        const resolvedUrl = new URL(childId, baseUrl);

        return resolvedUrl.href;
    } catch (error) {
        throw new Error(`Invalid $id resolution: baseId=${baseId}, childId=${childId}`);
    }
}

export default function __joinScope(previous?: string, id?: string) {
    const scope = _joinScope(previous, id);
    return scope === "" ? "#" : scope;
}
