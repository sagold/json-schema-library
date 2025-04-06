import { copyDraft } from "./utils/copyDraft";
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
