import { Draft } from "./types";
type PartialDraft = Partial<Omit<Draft, "errors" | "formats">> & {
    errors?: Partial<Draft["errors"]>;
    formats?: Partial<Draft["formats"]>;
};
export declare function extendDraft(draft: Draft, extension: PartialDraft): Draft;
export {};
