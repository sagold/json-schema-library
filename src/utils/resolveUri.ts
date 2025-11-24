import { resolve } from "uri-js";

const suffixes = /(#)+$/;
const trailingHash = /#$/;
const isDomain = /^[^:]+:\/\/[^/]+\//;
const idAndPointer = /#.*$/;

/**
 * Resolves a reference URI against a base URI.
 * Uses fast-uri (RFC 3986 compliant) for most cases, with special handling for JSON Schema specifics.
 *
 * This replaces the custom joinId logic while leveraging the standards-compliant fast-uri library.
 *
 * @param base - The base URI (e.g., current scope $id)
 * @param ref - The reference to resolve (e.g., $id, $ref, or json-pointer)
 * @returns The resolved absolute URI
 */
export function resolveUri(base?: string, ref?: string): string {
    if (ref == null) {
        return base?.replace(trailingHash, "") ?? "#";
    }

    if (base == null || base === "#") {
        return ref?.replace(trailingHash, "");
    }

    // If ref starts with #, it's a fragment - for JSON Schema, append to base without its fragment
    if (ref[0] === "#") {
        if (base[0] === "/") {
            return ref;
        }
        return `${base.replace(idAndPointer, "")}${ref.replace(suffixes, "")}`;
    }

    // If ref is a full domain, it's absolute
    if (isDomain.test(ref)) {
        return ref.replace(trailingHash, "");
    }

    return resolve(base, ref ?? "") ?? "#";
}
