import { addKeywords } from "./addKeywords";
import { sanitizeKeywords } from "./utils/sanitizeKeywords";
export function extendDraft(draft, extension) {
    var _a, _b;
    const { keywords } = addKeywords(draft, ...((_a = extension.keywords) !== null && _a !== void 0 ? _a : []));
    const errors = { ...draft.errors, ...((_b = extension.errors) !== null && _b !== void 0 ? _b : {}) };
    return sanitizeKeywords({
        ...draft,
        ...extension,
        keywords,
        errors
    });
}
