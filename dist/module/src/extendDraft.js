import { addKeywords } from "./addKeywords";
import { sanitizeKeywords } from "./utils/sanitizeKeywords";
export function extendDraft(draft, extension) {
    var _a, _b, _c;
    const { keywords } = addKeywords(draft, ...((_a = extension.keywords) !== null && _a !== void 0 ? _a : []));
    const errors = { ...draft.errors, ...((_b = extension.errors) !== null && _b !== void 0 ? _b : {}) };
    const formats = { ...draft.formats, ...((_c = extension.formats) !== null && _c !== void 0 ? _c : {}) };
    return sanitizeKeywords({
        ...draft,
        ...extension,
        formats,
        keywords,
        errors
    });
}
