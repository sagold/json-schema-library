import { join } from "@sagold/json-pointer";

/** Append a literal property or index without reinterpreting the existing pointer. */
export function appendDataPointer(pointer: string, key: string | number) {
    return pointer + join([String(key)]);
}
