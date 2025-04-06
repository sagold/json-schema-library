export function sanitizeKeywords(draft) {
    draft.keywords.forEach((keyword) => {
        const logKeyword = () => keyword.keyword;
        if (keyword.validate) {
            keyword.validate.toJSON = logKeyword;
        }
        if (keyword.reduce) {
            keyword.reduce.toJSON = logKeyword;
        }
        if (keyword.resolve) {
            keyword.resolve.toJSON = logKeyword;
        }
    });
    draft.keywords.sort((a, b) => { var _a, _b; return ((_a = b.order) !== null && _a !== void 0 ? _a : 0) - ((_b = a.order) !== null && _b !== void 0 ? _b : 0); });
    return draft;
}
