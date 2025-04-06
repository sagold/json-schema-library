import { Draft } from "../types";

export function sanitizeKeywords(draft: Draft) {
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
    return draft;
}
