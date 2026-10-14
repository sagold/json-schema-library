import { join } from "@sagold/json-pointer";

export function encodePointerProperty(property: string | number, uriFragment = true) {
    const token = join([`${property}`]).slice(1);
    if (!uriFragment) {
        return token;
    }
    try {
        return encodeURIComponent(token);
    } catch {
        return token.replace(/%/g, "%25");
    }
}

export function iterateProperties(properties: Record<string, unknown>) {
    return Object.keys(properties).map((name) => [name, encodePointerProperty(name)] as const);
}

export function appendDataPointer(pointer: string, property: string | number) {
    const token = encodePointerProperty(property, false);
    // "#" pointers are URI-decoded when split, so a literal "%" must be escaped
    return `${pointer}/${pointer.startsWith("#") ? token.replace(/%/g, "%25") : token}`;
}
