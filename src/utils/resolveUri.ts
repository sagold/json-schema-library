import { resolve } from "fast-uri";

const suffixes = /(#)+$/;
const trailingHash = /#$/;
const isDomain = /^[^:]+:\/\/[^/]+\//;
const idAndPointer = /#.*$/;

/**
 * Resolves a reference URI against a base URI.
 * Uses uri-js (RFC 3986) with JSON Schema fragment handling.
 * The anonymous document root is always represented by "#" (RFC 6901 section 6).
 *
 * @param base - The base URI (e.g., current scope $id)
 * @param ref - The reference to resolve (e.g., $id, $ref, or json-pointer)
 * @returns The resolved absolute URI
 */
export function resolveUri(base?: string, ref?: string): string {
    if (ref == null) {
        return base?.replace(trailingHash, "") || "#";
    }

    if (base == null || base === "#") {
        return ref.replace(trailingHash, "") || "#";
    }

    // If ref starts with #, it's a fragment - for JSON Schema, append to base without its fragment
    if (ref[0] === "#") {
        if (base[0] === "/") {
            return ref;
        }
        return `${base.replace(idAndPointer, "")}${ref.replace(suffixes, "")}` || "#";
    }

    // If ref is a full domain, it's absolute
    if (isDomain.test(ref)) {
        return ref.replace(trailingHash, "");
    }

    return resolve(base, ref) || "#";
}
