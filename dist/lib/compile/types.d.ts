import { JSONSchema, JSONPointer } from "../types";
export declare type Context = {
    ids: Record<string, JSONPointer>;
    remotes: Record<string, JSONSchema>;
};
