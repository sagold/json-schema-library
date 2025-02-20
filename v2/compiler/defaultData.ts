import { getObjectData } from "../features/object";
import { getStringData } from "../features/string";
import { SchemaNode } from "./types";

export const DEFAULT_DATA: ((node: SchemaNode) => void)[] = [getObjectData, getStringData].map((func) => {
    // @ts-expect-error extended function for debugging purposes
    func.toJSON = () => func.name;
    return func;
});
