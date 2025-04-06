import { Draft } from "./types";
type PartialDraft = Partial<Omit<Draft, "errors">> & {
    errors?: Partial<Draft["errors"]>;
};
export declare function extendDraft(draft: Draft, extension: PartialDraft): Draft;
export {};
