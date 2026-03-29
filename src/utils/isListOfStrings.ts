export function isListOfStrings(v: unknown): v is string[] {
    return Array.isArray(v) && v.find((item) => typeof item !== "string") == null;
}
