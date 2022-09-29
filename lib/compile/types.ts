import { JSONSchema, JSONPointer } from "../types";

export type Context = {
    ids: Record<string, JSONPointer>;
    remotes: Record<string, JSONSchema>;
};
