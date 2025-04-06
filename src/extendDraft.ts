import { addKeywords } from "./addKeywords";
import { sanitizeKeywords } from "./utils/sanitizeKeywords";
import { Draft } from "./types";

type PartialDraft = Partial<Omit<Draft, "errors">> & { errors?: Partial<Draft["errors"]> };

export function extendDraft(draft: Draft, extension: PartialDraft) {
    const { keywords } = addKeywords(draft, ...(extension.keywords ?? []));
    const errors = { ...draft.errors, ...(extension.errors ?? {}) };
    return sanitizeKeywords({
        ...draft,
        ...extension,
        keywords,
        errors
    });
}
