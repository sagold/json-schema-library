import { JsonSchema, JsonPointer } from "../types";
export type Context = {
    ids: Record<string, JsonPointer>;
    remotes: Record<string, JsonSchema>;
};
