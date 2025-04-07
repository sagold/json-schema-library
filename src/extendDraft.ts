import { addKeywords } from "./addKeywords";
import { sanitizeKeywords } from "./utils/sanitizeKeywords";
import { Draft } from "./types";

type PartialDraft = Partial<Omit<Draft, "errors" | "formats">> & {
    errors?: Partial<Draft["errors"]>;
    formats?: Partial<Draft["formats"]>;
};

export function extendDraft(draft: Draft, extension: PartialDraft) {
    const { keywords } = addKeywords(draft, ...(extension.keywords ?? []));
    const errors = { ...draft.errors, ...(extension.errors ?? {}) };
    const formats = { ...draft.formats, ...(extension.formats ?? {}) };
    return sanitizeKeywords({
        ...draft,
        ...extension,
        formats,
        keywords,
        errors
    });
}
