import getTypeOf from "../getTypeOf";

export function isObject(v: any): v is Record<string, unknown> {
    return getTypeOf(v) === "object";
}
