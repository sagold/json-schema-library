import { copyDraft } from "./utils/copyDraft";
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
export function addKeywords(draft, ...keywords) {
    const customizedDraft = copyDraft(draft);
    keywords.forEach((keyword) => addKeyword(customizedDraft, keyword));
    return customizedDraft;
}
/**
 * Create a new draft adding or replacing a keyword based on keyword-property
 */
function addKeyword(draft, keyword) {
    const index = draft.keywords.findIndex((f) => f.keyword === keyword.keyword);
    if (index === -1) {
        draft.keywords.push(keyword);
    }
    else {
        draft.keywords[index] = keyword;
    }
}
export function sanitizeKeywords(draft) {
    draft.keywords.forEach((keyword) => {
        var _a, _b, _c;
        const logKeyword = () => keyword.keyword;
        if (keyword.validate) {
            keyword.validate.toJSON = logKeyword;
            keyword.validate.order = (_a = keyword.order) !== null && _a !== void 0 ? _a : 0;
        }
        if (keyword.reduce) {
            keyword.reduce.toJSON = logKeyword;
            keyword.reduce.order = (_b = keyword.order) !== null && _b !== void 0 ? _b : 0;
        }
        if (keyword.resolve) {
            keyword.resolve.toJSON = logKeyword;
            keyword.resolve.order = (_c = keyword.order) !== null && _c !== void 0 ? _c : 0;
        }
    });
    draft.keywords.sort((a, b) => { var _a, _b; return ((_a = b.order) !== null && _a !== void 0 ? _a : 0) - ((_b = a.order) !== null && _b !== void 0 ? _b : 0); });
    return draft;
}
